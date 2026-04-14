"""
Genesis AI Agent - 区块链交互模块（完整版）
与智能合约交互执行真实交易
"""

import logging
from typing import Dict, Optional
from web3 import Web3
from web3.contract import Contract
from web3.exceptions import ContractLogicError
import asyncio
import json

from .engines.strategy_engine import Position as EnginePosition

logger = logging.getLogger(__name__)


class ChainInteraction:
    """区块链交互类 - 真实链上交易"""
    
    def __init__(
        self,
        rpc_url: str,
        vault_address: str,
        private_key: str,
        chain_id: int = 1101  # Polygon zkEVM
    ):
        self.rpc_url = rpc_url
        self.vault_address = vault_address
        self.private_key = private_key
        self.chain_id = chain_id
        
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.account = self.w3.eth.account.from_key(private_key)
        self.vault_contract: Optional[Contract] = None
        self.synth_contract: Optional[Contract] = None
        self.usdc_contract: Optional[Contract] = None
        
        logger.info(f"区块链交互初始化: {rpc_url}")
        logger.info(f"账户地址: {self.account.address}")
        logger.info(f"Vault 地址: {vault_address}")
        
        # 延迟加载合约
        self._contracts_loaded = False
    
    async def load_contracts(self):
        """加载合约 ABI"""
        if self._contracts_loaded:
            return True
        
        try:
            # 加载合约 ABI（从构建的 artifact）
            vault_abi_path = "/workspace/projects/workspace/genesis-ai/contracts/artifacts/contracts/GenesisVault.sol/GenesisVault.json"
            with open(vault_abi_path, 'r') as f:
                vault_abi = json.load(f)
            
            synth_abi_path = "/workspace/projects/workspace/genesis-ai/contracts/artifacts/contracts/GenesisSynth.sol/GenesisSynth.json"
            with open(synth_abi_path, 'r') as f:
                synth_abi = json.load(f)
            
            # 初始化合约实例
            self.vault_contract = self.w3.eth.contract(address=self.vault_address, abi=vault_abi['abi'])
            
            # 获取 Synth 地址
            synth_address = self.vault_contract.functions.synth().call()
            self.synth_contract = self.w3.eth.contract(address=synth_address, abi=synth_abi['abi'])
            
            # 获取 USDC 地址
            usdc_address = self.vault_contract.functions.usdc().call()
            usdc_abi_path = "/workspace/projects/workspace/genesis-ai/contracts/artifacts/contracts/Mocks/MockERC20.sol/MockERC20.json"
            with open(usdc_abi_path, 'r') as f:
                usdc_abi = json.load(f)
            self.usdc_contract = self.w3.eth.contract(address=usdc_address, abi=usdc_abi['abi'])
            
            self._contracts_loaded = True
            logger.info("合约 ABI 加载完成")
            
            return True
        except Exception as e:
            logger.error(f"加载合约 ABI 失败: {e}")
            self._contracts_loaded = False
            return False
    
    async def test_connection(self) -> bool:
        """测试区块链连接"""
        try:
            # 检查连接
            is_connected = self.w3.is_connected()
            if not is_connected:
                logger.warning("区块链未连接")
                return False
            
            # 检查 Chain ID
            chain_id = self.w3.eth.chain_id
            if chain_id != self.chain_id:
                logger.warning(f"Chain ID 不匹配: 期望 {self.chain_id}, 实际 {chain_id}")
                return False
            
            # 检查账户余额
            balance = self.w3.eth.get_balance(self.account.address)
            logger.info(f"账户余额: {self.w3.from_wei(balance)} ETH")
            
            return True
        except Exception as e:
            logger.error(f"区块链连接测试失败: {e}")
            return False
    
    async def get_user_balance(self, user: str) -> float:
        """
        获取用户 USDC 余额
        
        Returns:
            USDC 余额 (6位精度)
        """
        try:
            await self.load_contracts()
            
            balance = self.usdc_contract.functions.balanceOf(user).call()
            return balance / 1e6  # 转换为美元
        except Exception as e:
            logger.error(f"获取用户余额失败: {e}")
            return 0.0
    
    async def get_user_positions(self, user: str) -> Dict:
        """
        获取用户所有持仓
        
        Returns:
            持仓信息列表
        """
        try:
            await self.load_contracts()
            
            # 检查用户是否存在持仓
            user_info = self.vault_contract.functions.getUserInfo(user).call()
            positions_count = user_info[3]  # openPositionsCount
            
            if positions_count == 0:
                return {}
            
            positions = {}
            
            # 从部署信息获取已注册的资产列表
            deployment_path = "/workspace/projects/workspace/genesis-ai/contracts/deployments/hardhat.json"
            with open(deployment_path, 'r') as f:
                deployment_info = json.load(f)
            
            assets = deployment_info.get('assets', [])
            
            for asset_line in assets:
                parts = asset_line.split(": ")
                if len(parts) >= 2:
                    symbol = parts[0]
                    asset_address = parts[1].strip()
                    
                    try:
                        position_data = self.vault_contract.functions.getUserPosition(user, asset_address).call()
                        
                        if position_data[5]:  # isActive
                            positions[symbol] = {
                                "collateral": position_data[0] / 1e6,  # USDC
                                "syntheticAmount": position_data[1] / 1e18,  # 18位精度
                                "syntheticAsset": position_data[2],  # 合约地址
                                "entryPrice": position_data[3] / 1e18,  # 18位精度
                                "leverage": position_data[4],  # 整数
                                "timestamp": position_data[5],  # 时间戳
                                "isLong": position_data[6],  # 是否多头
                                "isActive": position_data[7],  # 是否活跃
                            }
                    except ContractLogicError as e:
                        logger.warning(f"无法获取 {symbol} 仓位: {e}")
                        continue
            
            return positions
        except Exception as e:
            logger.error(f"获取用户持仓失败: {e}")
            return {}
    
    async def open_position(
        self,
        user: str,
        synthetic_asset: str,
        collateral_amount: float,
        synthetic_amount: float,
        leverage: int,
        is_long: bool
    ) -> Dict:
        """
        开仓（真实链上交易）
        
        Args:
            user: 用户地址
            synthetic_asset: 合成资产地址
            collateral_amount: 抵押品金额 (USDC)
            synthetic_amount: 合成资产数量
            leverage: 杠杆倍数
            is_long: 多头/空头
        
        Returns:
            交易结果
        """
        await self.load_contracts()
        
        logger.info(f"开仓请求: {user[:6]}...{user[-4:]}")
        logger.info(f"  资产: {synthetic_asset[:10]}...{synthetic_asset[-4:]}")
        logger.info(f"  抵押: ${collateral_amount} USDC, 数量: {synthetic_amount}, 杠杆: {leverage}x, {'多头' if is_long else '空头'}")
        
        try:
            # 1. 构建 openPosition 调用
            collateral_amount_wei = int(collateral_amount * 1e6)  # 转为 6位精度
            synthetic_amount_wei = int(synthetic_amount * 1e18)  # 转为 18位精度
            leverage_wei = leverage  # 整数
            
            # 估算 Gas
            gas_estimate = self.vault.functions.openPosition(
                user,
                synthetic_asset,
                collateral_amount_wei,
                synthetic_amount_wei,
                leverage_wei,
                is_long
            ).estimate_gas({'from': self.account.address})
            
            logger.info(f"Gas 估算: {gas_estimate:,}")
            
            # 2. 签名交易
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            tx_hash = ""
            
            # 发送交易
            tx_hash = await self.vault.functions.openPosition(
                user,
                synthetic_asset,
                collateral_amount_wei,
                synthetic_amount_wei,
                leverage_wei,
                is_long
            ).transact({
                'from': self.account.address,
                'gas': gas_estimate,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })
            
            logger.info(f"交易已发送: {tx_hash}")
            
            # 3. 等待确认
            receipt = await self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status == 1:
                logger.info(f"✅ 开仓成功: {receipt.transactionHash.hex()}")
                
                return {
                    "success": True,
                    "tx_hash": receipt.transactionHash.hex(),
                    "block_number": receipt.blockNumber,
                    "gas_used": receipt.gasUsed,
                    "effective_gas_price": receipt.effectiveGasPrice,
                    "transaction_index": receipt.transactionIndex,
                }
            else:
                logger.error(f"❌ 交易失败: {receipt.revert_reason}")
                return {
                    "success": False,
                    "error": receipt.revert_reason,
                    "tx_hash": receipt.transactionHash.hex(),
                }
            
        except ContractLogicError as e:
            error_msg = str(e)
            if "not authorized" in error_msg.lower():
                logger.error("❌ AI Agent 未授权")
                return {"success": False, "error": "AI Agent 未授权"}
            else:
                logger.error(f"合约调用失败: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"开仓失败: {e}")
            return {"success": False, "error": str(e)}
    
    async def close_position(
        self,
        user: str,
        synthetic_asset: str
    ) -> Dict:
        """
        平仓（真实链上交易）
        
        Args:
            user: 用户地址
            synthetic_asset: 合成资产地址
        
        Returns:
            交易结果
        """
        await self.load_contracts()
        
        logger.info(f"平仓请求: {user[:6]}...{user[-4:]}")
        logger.info(f"  资产: {synthetic_asset[:10]}...{synthetic_asset[-4:]}")
        
        try:
            # 1. 计算 PnL
            pnl_wei = self.vault.functions.calculatePnL(user, synthetic_asset).call()
            pnl = pnl_wei / 1e6  # 转为 USDC
            
            # 2. 构建 closePosition 调用
            gas_estimate = self.vault.functions.closePosition(
                user,
                synthetic_asset
            ).estimate_gas({'from': self.account.address})
            
            logger.info(f"Gas 估算: {gas_estimate:,}")
            
            # 3. 签名交易
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            # 发送交易
            tx_hash = await self.vault.functions.closePosition(
                user,
                synthetic_asset
            ).transact({
                'from': self.account.address,
                'gas': gas_estimate,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })
            
            logger.info(f"交易已发送: {tx_hash}")
            
            # 4. 等待确认
            receipt = await self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status == 1:
                logger.info(f"✅ 平仓成功: {receipt.transactionHash.hex()}")
                
                return {
                    "success": True,
                    "tx_hash": receipt.transactionHash.hex(),
                    "block_number": receipt.blockNumber,
                    "gas_used": receipt.gasUsed,
                    "effective_gas_price": receipt.effectiveGasPrice,
                    "transaction_index": receipt.transactionIndex,
                    "realized_pnl": pnl,
                }
            else:
                logger.error(f"❌ 交易失败: {receipt.revert_reason}")
                return {
                    "success": False,
                    "error": receipt.revert_reason,
                    "tx_hash": receipt.transactionHash.hex(),
                }
            
        except ContractLogicError as e:
            error_msg = str(e)
            if "not authorized" in error_msg.lower():
                logger.error("❌ AI Agent 未授权")
                return {"success": False, "error": "AI Agent 未授权"}
            else:
                logger.error(f"合约调用失败: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"平仓失败: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_current_price(self, synthetic_asset: str) -> Optional[float]:
        """
        获取合成资产当前价格
        
        Args:
            synthetic_asset: 合成资产地址
        
        Returns:
            当前价格（18位精度）
        """
        try:
            await self.load_contracts()
            price = self.synth_contract.functions.getPrice(synthetic_asset).call()
            return price / 1e18  # 转为普通数值
        except Exception as e:
            logger.error(f"获取价格失败: {e}")
            return None
    
    async def approve_usdc(self, amount: float) -> bool:
        """
        授权 USDC 给 Vault 合约（用户需要预先授权）
        
        Args:
            amount: 授权金额 (USDC)
        
        Returns:
            是否成功
        """
        await self.load_contracts()
        
        try:
            amount_wei = int(amount * 1e6)
            approve_tx = self.usdc_contract.functions.approve(
                self.vault_address,
                amount_wei
            ).transact({'from': self.account.address})
            
            receipt = await self.w3.eth.wait_for_transaction_receipt(approve_tx, timeout=30)
            
            if receipt.status == 1:
                logger.info(f"✅ USDC 授权成功: {approve_tx.transactionHash.hex()}")
                return True
            else:
                logger.error(f"❌ USDC 授权失败: {receipt.revert_reason}")
                return False
        except Exception as e:
            logger.error(f"授权失败: {e}")
            return False
    
    async def deposit(self, amount: float) -> Dict:
        """
        存款（用户调用）
        
        Args:
            amount: 存款金额 (USDC)
        
        Returns:
            交易结果
        """
        await self.load_contracts()
        
        try:
            amount_wei = int(amount * 1e6)
            
            # 先授权
            approve_tx = self.usdc_contract.functions.approve(
                self.vault_address,
                amount_wei
            ).transact({'from': self.account.address})
            
            approve_receipt = await self.w3.eth.wait_for_transaction_receipt(approve_tx, timeout=30)
            
            if approve_receipt.status != 1:
                return {"success": False, "error": "USDC 授权失败"}
            
            # 存款
            deposit_tx = self.vault.functions.deposit(amount_wei).transact({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
            })
            
            receipt = await self.w3.eth.wait_for_transaction_receipt(deposit_tx, timeout=60)
            
            if receipt.status == 1:
                logger.info(f"✅ 存款成功: {deposit_tx.transactionHash.hex()}")
                return {
                    "success": True,
                    "tx_hash": deposit_tx.transactionHash.hex(),
                    "amount": amount,
                }
            else:
                logger.error(f"❌ 存款失败: {receipt.revert_reason}")
                return {
                    "success": False,
                    "error": receipt.revert_reason,
                    "tx_hash": deposit_tx.transactionHash.hex(),
                }
            
        except Exception as e:
            logger.error(f"存款失败: {e}")
            return {"success": False, "error": str(e)}
    
    async def withdraw(self, amount: float) -> Dict:
        """
        取款（用户调用）
        
        Args:
            amount: 取款金额 (USDC)
        
        Returns:
            交易结果
        """
        await self.load_contracts()
        
        try:
            amount_wei = int(amount * 1e6)
            
            # 取款
            withdraw_tx = self.vault.functions.withdraw(amount_wei).transact({
                'from': self.account.address,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
            })
            
            receipt = await self.w3.eth.wait_for_transaction_receipt(withdraw_tx, timeout=60)
            
            if receipt.status == 1:
                logger.info(f"✅ 取款成功: {withdraw_tx.transactionHash.hex()}")
                return {
                    "success": True,
                    "tx_hash": withdraw_tx.transactionHash.hex(),
                    "amount": amount,
                }
            else:
                logger.error(f"❌ 取款失败: {receipt.revert_reason}")
                return {
                    "success": False,
                    "error": receipt.revert_reason,
                    "tx_hash": withdraw_tx.transactionHash.hex(),
                }
            
        except Exception as e:
            logger.error(f"取款失败: {e}")
            return {"success": False, "error": str(e)}
