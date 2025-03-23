document.addEventListener('DOMContentLoaded', function() {
    // API Key สำหรับ remove.bg
    const API_KEY = "VEjMfyz3s1dZxJKnbQYAG9m8";
    
    // DOM Elements
    const imageInput = document.getElementById('imageInput');
    const originalImage = document.getElementById('originalImage');
    const processedImage = document.getElementById('processedImage');
    const croppedImage = document.getElementById('croppedImage');
    const previewContainer = document.getElementById('previewContainer');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadSection = document.getElementById('downloadSection');
    const spinner = document.getElementById('spinner');
    
    // ตัวแปรเก็บข้อมูลรูปภาพ
    let processedImageBlob = null;
    
    // DOM Elements สำหรับแสดงสถานะ
    const statusMessage = document.createElement('div');
    statusMessage.className = 'status-message';
    document.querySelector('.container').appendChild(statusMessage);
    
    // Event Listeners
    imageInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadCroppedImage);
    
    // ฟังก์ชั่นเมื่อมีการอัพโหลดรูปภาพ
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // แสดงสถานะ
        updateStatus('กำลังโหลดรูปภาพ...', 'info');
        
        // แสดงรูปต้นฉบับ
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage.src = e.target.result;
            previewContainer.classList.remove('hidden');
            spinner.classList.remove('hidden');
            
            // แสดงข้อความว่ากำลังส่งรูปไปลบพื้นหลัง
            updateStatus('กำลังส่งรูปภาพไปลบพื้นหลังที่ Remove.bg... (อาจใช้เวลา 5-10 วินาที)', 'processing');
            
            // เรียกฟังก์ชันลบพื้นหลัง
            removeBackground(file);
        };
        reader.readAsDataURL(file);
    }
    
    // ฟังก์ชั่นอัพเดทสถานะ
    function updateStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
        statusMessage.classList.remove('hidden');
    }
    
    // ฟังก์ชั่นลบพื้นหลังด้วย remove.bg API
    function removeBackground(file) {
        const formData = new FormData();
        formData.append('image_file', file);
        formData.append('size', 'auto');
        
        // เพิ่มการจัดการ timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 วินาที timeout
        
        fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY
            },
            body: formData,
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('คุณใช้งาน API เกินขีดจำกัด โปรดลองอีกครั้งในภายหลัง');
                }
                if (response.status === 402) {
                    throw new Error('คีย์ API หมดอายุหรือเครดิตหมด โปรดตรวจสอบบัญชี Remove.bg ของคุณ');
                }
                throw new Error('การเชื่อมต่อกับ Remove.bg ล้มเหลว (รหัส: ' + response.status + ')');
            }
            updateStatus('ได้รับรูปภาพที่ลบพื้นหลังแล้ว กำลังประมวลผล...', 'success');
            return response.blob();
        })
        .then(blob => {
            // เก็บ blob สำหรับดาวน์โหลดภายหลัง
            processedImageBlob = blob;
            
            const url = URL.createObjectURL(blob);
            processedImage.src = url;
            
            updateStatus('กำลังสร้างรูปติดบัตร...', 'processing');
            
            // สร้างปุ่มดาวน์โหลดรูปที่ลบพื้นหลัง
            addDownloadButtonForProcessedImage();
            
            // สร้างรูปภาพใหม่เพื่อคำนวณการครอป
            const img = new Image();
            img.onload = function() {
                cropToHeadshot(img);
                updateStatus('เสร็จสิ้น! คุณสามารถดาวน์โหลดรูปได้ทั้งสองแบบ', 'success');
            };
            img.src = url;
        })
        .catch(error => {
            console.error('Error:', error);
            if (error.name === 'AbortError') {
                updateStatus('การเชื่อมต่อกับ Remove.bg หมดเวลา โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองอีกครั้ง', 'error');
            } else {
                updateStatus('เกิดข้อผิดพลาด: ' + error.message, 'error');
            }
        })
        .finally(() => {
            spinner.classList.add('hidden');
        });
    }
    
    // ฟังก์ชั่นเพิ่มปุ่มดาวน์โหลดรูปที่ลบพื้นหลัง
    function addDownloadButtonForProcessedImage() {
        // ตรวจสอบว่ามีปุ่มอยู่แล้วหรือไม่
        let downloadProcessedBtn = document.getElementById('downloadProcessedBtn');
        
        if (!downloadProcessedBtn) {
            // สร้างปุ่มดาวน์โหลดรูปที่ลบพื้นหลัง
            downloadProcessedBtn = document.createElement('button');
            downloadProcessedBtn.id = 'downloadProcessedBtn';
            downloadProcessedBtn.className = 'download-button';
            downloadProcessedBtn.textContent = 'ดาวน์โหลดรูปที่ลบพื้นหลัง (คุณภาพสูง)';
            
            // เพิ่ม event listener สำหรับการดาวน์โหลด
            downloadProcessedBtn.addEventListener('click', function() {
                if (processedImageBlob) {
                    // สร้างรูปภาพคุณภาพสูงจาก blob
                    const img = new Image();
                    img.onload = function() {
                        // สร้าง canvas ใหม่ที่มีความละเอียดสูงยิ่งขึ้น
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        
                        ctx.drawImage(img, 0, 0);
                        
                        const link = document.createElement('a');
                        link.download = 'transparent_background_high_quality.png';
                        link.href = canvas.toDataURL('image/png', 1.0);
                        link.click();
                        
                        updateStatus('กำลังดาวน์โหลดรูปที่ลบพื้นหลังคุณภาพสูง...', 'success');
                    };
                    
                    img.src = URL.createObjectURL(processedImageBlob);
                }
            });
            
            // หาตำแหน่งสำหรับใส่ปุ่ม
            const processedSection = processedImage.closest('.preview-section');
            processedSection.appendChild(downloadProcessedBtn);
        }
    }
    
    // ฟังก์ชั่นครอปรูปเป็น headshot ขนาด 30x40 mm
    function cropToHeadshot(img) {
        updateStatus('กำลังครอปรูปให้ได้ขนาดมาตรฐาน 30×40 mm...', 'processing');
        
        // เพิ่มความละเอียดอีก 30%
        const pixelsPerMM = 13; // เพิ่มจาก 10 เป็น 13 (เพิ่ม 30%)
        const targetWidth = Math.floor(30 * pixelsPerMM);
        const targetHeight = Math.floor(40 * pixelsPerMM);
        
        // สร้าง canvas สำหรับครอปรูป
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        // ตั้งค่าเพื่อให้การแสดงผลภาพคมชัดขึ้น
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // เติมพื้นหลังสีขาว
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // คำนวณอัตราส่วนการย่อขยาย
        const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // คำนวณตำแหน่งให้อยู่ตรงกลาง
        const x = (targetWidth - scaledWidth) / 2;
        const y = (targetHeight - scaledHeight) / 2;
        
        // วาดรูปลงบน canvas
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // แสดงผลลัพธ์ - ใช้คุณภาพสูงขึ้น
        croppedImage.src = canvas.toDataURL('image/png', 1.0);
        downloadSection.classList.remove('hidden');
        
        // เปลี่ยนข้อความปุ่มดาวน์โหลดให้เฉพาะเจาะจงมากขึ้น
        downloadBtn.textContent = 'ดาวน์โหลดรูปติดบัตร 30×40 mm (คุณภาพสูง)';
        
        // เพิ่มข้อมูลขนาดรูปภาพ
        addImageSizeInfo(canvas, img);
    }
    
    // ฟังก์ชั่นเพิ่มข้อมูลขนาดรูปภาพ
    function addImageSizeInfo(canvas, originalImg) {
        // สร้าง div สำหรับแสดงข้อมูลขนาดรูปภาพ
        let sizeInfoDiv = document.getElementById('imageSizeInfo');
        
        if (!sizeInfoDiv) {
            sizeInfoDiv = document.createElement('div');
            sizeInfoDiv.id = 'imageSizeInfo';
            sizeInfoDiv.className = 'image-info';
            
            const croppedSection = croppedImage.closest('.preview-section');
            croppedSection.appendChild(sizeInfoDiv);
        }
        
        // แสดงขนาดรูปภาพ
        sizeInfoDiv.innerHTML = `
            <p>ขนาด: 30×40 mm (${canvas.width}×${canvas.height} pixels)</p>
            <p>อัตราส่วนพิกเซล: 13 pixels/mm (คุณภาพสูง)</p>
            <p>ความละเอียด: ${Math.round(13 * 25.4)} DPI</p>
        `;
    }
    
    // ฟังก์ชั่นดาวน์โหลดรูปที่ครอปแล้ว
    function downloadCroppedImage() {
        // สร้างรูปภาพที่มีความละเอียดสูงสำหรับดาวน์โหลด (ถ้ามีการเรียกใช้ canvas ใหม่)
        const img = new Image();
        img.onload = function() {
            // สร้าง canvas ใหม่ที่มีความละเอียดสูงยิ่งขึ้นสำหรับการดาวน์โหลด
            const pixelsPerMM = 15; // เพิ่มความละเอียดสำหรับการดาวน์โหลดอีก
            const targetWidth = Math.floor(30 * pixelsPerMM);
            const targetHeight = Math.floor(40 * pixelsPerMM);
            
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            
            // ตั้งค่าการแสดงผลภาพคุณภาพสูง
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // เติมพื้นหลังสีขาว
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // คำนวณอัตราส่วนการย่อขยาย
            const scale = Math.min(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
            const scaledWidth = img.naturalWidth * scale;
            const scaledHeight = img.naturalHeight * scale;
            
            // คำนวณตำแหน่งให้อยู่ตรงกลาง
            const x = (targetWidth - scaledWidth) / 2;
            const y = (targetHeight - scaledHeight) / 2;
            
            // วาดรูปลงบน canvas
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            // ดาวน์โหลดรูปภาพคุณภาพสูง
            const link = document.createElement('a');
            link.download = 'headshot_30x40mm_high_quality.png';
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            updateStatus('กำลังดาวน์โหลดรูปติดบัตรคุณภาพสูง...', 'success');
        };
        img.src = processedImage.src;
    }
});
