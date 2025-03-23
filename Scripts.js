document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('previewContainer');
    const resolutionSlider = document.getElementById('resolutionSlider');
    const resolutionValue = document.getElementById('resolutionValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadSection = document.getElementById('downloadSection');

    let processedImages = [];

    imageInput.addEventListener('change', handleImageUpload);
    resolutionSlider.addEventListener('input', function() {
        resolutionValue.textContent = this.value + " px";
    });
    downloadBtn.addEventListener('click', downloadAllImages);

    function handleImageUpload(event) {
        const files = event.target.files;
        if (!files.length) return;

        previewContainer.innerHTML = "";
        processedImages = [];

        for (let file of files) {
            processImage(file);
        }
    }

    function processImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageCard = document.createElement('div');
            imageCard.className = "image-card";
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imageCard.appendChild(imgElement);
            previewContainer.appendChild(imageCard);

            // Simulate processing
            setTimeout(() => {
                removeBackground(file, imgElement, imageCard);
            }, 1000);
        };
        reader.readAsDataURL(file);
    }

    function removeBackground(file, imgElement, imageCard) {
        const newImg = document.createElement('img');
        newImg.src = imgElement.src;
        newImg.style.border = "2px solid #000";

        const croppedImg = cropToResolution(newImg);

        imageCard.appendChild(croppedImg);
        processedImages.push(croppedImg.src);
        downloadSection.classList.remove('hidden');
    }

    function cropToResolution(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = parseInt(resolutionSlider.value);

        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const newImg = document.createElement('img');
        newImg.src = canvas.toDataURL('image/png');
        newImg.className = "cropped-image";
        return newImg;
    }

    function downloadAllImages() {
        processedImages.forEach((src, index) => {
            const link = document.createElement('a');
            link.download = `processed_image_${index + 1}.png`;
            link.href = src;
            link.click();
        });
    }
});
