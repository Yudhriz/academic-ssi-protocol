require('dotenv').config();
const { ethers } = require('ethers');

// Konfigurasi Standar ERC-1056
const REGISTRY_ADDRESS = '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818';
const ETH_TO_IDR = 38500000; // Asumsi 1 ETH = Rp 38.500.000 (Sesuai Harga Saat Ini)

// ABI minimal untuk fungsi setAttribute
const ERC1056_ABI = [
    'function setAttribute(address identity, bytes32 name, bytes value, uint validity) public'
];

async function measureGas() {
    console.log('=== MEMULAI ESTIMASI GAS TIER INFRASTRUKTUR ===\n');
    
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.STUDENT_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(REGISTRY_ADDRESS, ERC1056_ABI, wallet);

    // Parameter dummy untuk setAttribute (contoh: menambahkan public key baru)
    const identity = process.env.STUDENT_ADDRESS;
    const attributeName = ethers.encodeBytes32String('veriKey');
    const attributeValue = ethers.hexlify(ethers.randomBytes(32)); 
    const validity = 86400; // 1 Hari dalam detik

    try {
        // 1. Dapatkan estimasi Gas Limit (HANYA ESTIMASI)
        const gasLimit = await contract.setAttribute.estimateGas(identity, attributeName, attributeValue, validity);
        
        // 2. Dapatkan estimasi Base Fee / Gas Price saat ini di Sepolia
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice;

        // 3. Kalkulasi Total Biaya
        const totalGasCostWei = gasLimit * gasPrice;
        const totalGasCostEth = ethers.formatEther(totalGasCostWei);
        const totalCostIDR = parseFloat(totalGasCostEth) * ETH_TO_IDR;

        console.log(`[Metrik Infrastruktur ERC-1056 Sepolia]`);
        console.log(`- Target Registry : ${REGISTRY_ADDRESS}`);
        console.log(`- Fungsi          : setAttribute()`);
        console.log(`- Gas Limit       : ${gasLimit.toString()} units`);
        console.log(`- Gas Price       : ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
        console.log(`- Estimasi Biaya  : ${totalGasCostEth} ETH`);
        console.log(`- Konversi IDR    : Rp ${totalCostIDR.toLocaleString('id-ID', { minimumFractionDigits: 2 })}\n`);

        // ==============================================================================
        // 🚀 EKSEKUSI TRANSAKSI RIIL 
        // Buka comment (uncomment) blok di bawah ini HANYA JIKA ingin 
        // mengirim transaksi sungguhan ke Sepolia untuk mendapatkan Transaction Hash
        // ==============================================================================
        
        // console.log(`⏳ Mengirim transaksi ke jaringan Sepolia...`);
        // const tx = await contract.setAttribute(identity, attributeName, attributeValue, validity);
        
        // console.log(`🔗 Transaction Hash: ${tx.hash}`);
        // console.log(`🌐 Pantau di Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        // console.log(`⏳ Menunggu konfirmasi dari miner (biasanya 10-15 detik)...`);
        // const receipt = await tx.wait();
        
        // console.log(`\n✅ Transaksi SUKSES Tercatat di Blockchain!`);
        // console.log(`- Gas Riil yang Terpakai: ${receipt.gasUsed.toString()} units`);
        
        // ==============================================================================

        console.log('✅ Eksekusi Gas Tracker Selesai.');

    } catch (error) {
        console.error('❌ Gagal melakukan pengujian:', error.message);
    }
}

measureGas();