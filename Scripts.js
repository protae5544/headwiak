document.addEventListener('DOMContentLoaded', function() {
    var dropArea = document.getElementById('drop-area');
    var fileInput = document.getElementById('file-input');
    var selectButton = document.getElementById('select-button');
    var progressContainer = document.getElementById('progress-container');
    var progressBar = document.getElementById('progress-bar');
    var preview = document.getElementById('preview');
    var htmlOutput = document.getElementById('html-output');
    var downloadButton = document.getElementById('download-html');
    var copyButton = document.getElementById('copy-html');
    
    // ตัวแปรเก็บข้อมูล
    var processedHTML = '';
    
    // อีเวนต์คลิกที่ปุ่มเลือกไฟล์
    selectButton.addEventListener('click', function() {
        fileInput.click();
    });
    
    // อีเวนต์เมื่อมีการเลือกไฟล์
    fileInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            processFile(file);
        } else {
            alert('กรุณาเลือกไฟล์ PDF เท่านั้น');
        }
    });
    
    // อีเวนต์ลากและวางไฟล์
    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropArea.style.backgroundColor = '#e9e9e9';
    });
    
    dropArea.addEventListener('dragleave', function() {
        dropArea.style.backgroundColor = '#f9f9f9';
    });
    
    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        dropArea.style.backgroundColor = '#f9f9f9';
        
        var file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            processFile(file);
        } else {
            alert('กรุณาลากไฟล์ PDF เท่านั้น');
        }
    });
    
    // อีเวนต์ดาวน์โหลด HTML
    downloadButton.addEventListener('click', function() {
        if (processedHTML) {
            var blob = new Blob([processedHTML], { type: 'text/html' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'converted-document.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });
    
    // อีเวนต์คัดลอก HTML
    copyButton.addEventListener('click', function() {
        if (processedHTML) {
            navigator.clipboard.writeText(processedHTML).then(function() {
                alert('คัดลอก HTML เรียบร้อยแล้ว');
            }, function() {
                alert('ไม่สามารถคัดลอกได้ กรุณาลองอีกครั้ง');
            });
        }
    });
    
    // ฟังก์ชันประมวลผลไฟล์ PDF
    function processFile(file) {
        var reader = new FileReader();
        
        reader.onload = function(event) {
            var pdfData = new Uint8Array(event.target.result);
            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
            
            pdfjsLib.getDocument({ data: pdfData }).promise.then(function(pdf) {
                var numPages = pdf.numPages;
                
                // เริ่มต้นสร้าง HTML
                var htmlContent = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">' +
                '<html lang="th">' +
                '<head>' +
                '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
                '<title>แปลงจาก PDF</title>' +
                '<style type="text/css">' +
                'body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }' +
                '.page { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }' +
                '.page-header { text-align: center; margin-bottom: 20px; font-weight: bold; }' +
                'p { margin-bottom: 10px; }' +
                'h1, h2, h3 { color: #333; }' +
                '.page-number { text-align: center; margin-top: 20px; color: #888; }' +
                '</style>' +
                '</head>' +
                '<body>';
                
                // วนลูปแปลงแต่ละหน้า
                var processPage = function(pageNum) {
                    pdf.getPage(pageNum).then(function(page) {
                        var viewport = page.getViewport({ scale: 1.0 });
                        
                        // แปลงเนื้อหาจาก PDF เป็นข้อความ
                        page.getTextContent().then(function(textContent) {
                            // เริ่มต้นของหน้า
                            htmlContent += '<div class="page" id="page-' + pageNum + '">' +
                            '<div class="page-header">หน้า ' + pageNum + ' จาก ' + numPages + '</div>';
                            
                            // จัดโครงสร้างเนื้อหา
                            var lastY = null;
                            var isParagraph = false;
                            var currentText = '';
                            var items = textContent.items;
                            
                            // เริ่มสร้างโครงสร้างเอกสาร
                            for (var j = 0; j < items.length; j++) {
                                var item = items[j];
                                
                                // ตรวจสอบขนาดตัวอักษร (ถ้ามี) เพื่อกำหนดหัวข้อ
                                var fontSize = item.transform[3];
                                
                                // ถ้าตำแหน่ง Y เปลี่ยน จบย่อหน้า
                                if (lastY !== null && Math.abs(lastY - item.transform[5]) > 2) {
                                    if (isParagraph && currentText.trim() !== '') {
                                        htmlContent += '<p>' + currentText.trim() + '</p>';
                                    }
                                    isParagraph = false;
                                    currentText = '';
                                }
                                
                                // ตรวจสอบขนาดตัวอักษรเพื่อกำหนดหัวข้อ
                                if (fontSize > 16) {
                                    if (isParagraph && currentText.trim() !== '') {
                                        htmlContent += '<p>' + currentText.trim() + '</p>';
                                        isParagraph = false;
                                        currentText = '';
                                    }
                                    htmlContent += '<h1>' + item.str.trim() + '</h1>';
                                } else if (fontSize > 14) {
                                    if (isParagraph && currentText.trim() !== '') {
                                        htmlContent += '<p>' + currentText.trim() + '</p>';
                                        isParagraph = false;
                                        currentText = '';
                                    }
                                    htmlContent += '<h2>' + item.str.trim() + '</h2>';