document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const editorContainer = document.getElementById('editor-container');
    const canvas = document.getElementById('sketch-canvas');
    const ctx = canvas.getContext('2d');
    const blurSlider = document.getElementById('blur-slider');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');

    // State
    let originalImage = null;
    let isProcessing = false;

    // --- Upload Handling ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImage(file);
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadImage(file);
    });

    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                // Scale Canvas to Image, max width 800px to keep performance high
                const maxWidth = 1200;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = height * ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Show editor, hide upload
                dropZone.classList.add('hidden');
                editorContainer.classList.remove('hidden');

                applySketchEffect();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // --- Core Processing Logic ---
    function applySketchEffect() {
        if (!originalImage || isProcessing) return;
        isProcessing = true;

        // Get params
        const blurRadius = blurSlider.value;

        // Use requestAnimationFrame to prevent UI blocking
        requestAnimationFrame(() => {
            // 1. Draw Base Grayscale
            ctx.filter = 'grayscale(100%)';
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

            // 2. Prepare Overlay Layer (Inverted + Blurred)
            // We use an offscreen canvas for the blend layer
            const offCanvas = document.createElement('canvas');
            offCanvas.width = canvas.width;
            offCanvas.height = canvas.height;
            const offCtx = offCanvas.getContext('2d');

            // Draw inverted and blurred version to offscreen
            // We apply grayscale here too to ensure it matches
            offCtx.filter = `grayscale(100%) invert(100%) blur(${blurRadius}px)`;
            offCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

            // 3. Color Dodge Blend
            // The magic happens here: Color Dodge blends the grayscale base with the inverted blurred layer
            ctx.globalCompositeOperation = 'color-dodge';
            ctx.drawImage(offCanvas, 0, 0);

            // 4. (Optional) slight contrast boost or level correction could go here
            // But standard color dodge usually looks good.

            // Reset
            ctx.filter = 'none';
            ctx.globalCompositeOperation = 'source-over';
            isProcessing = false;
        });
    }

    // --- Controls ---
    blurSlider.addEventListener('input', () => {
        applySketchEffect();
    });

    resetBtn.addEventListener('click', () => {
        originalImage = null;
        fileInput.value = '';
        dropZone.classList.remove('hidden');
        editorContainer.classList.add('hidden');
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'pencil-sketch.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    });
});
