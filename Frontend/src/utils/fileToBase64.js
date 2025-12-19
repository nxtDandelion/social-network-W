import { compressImage } from "./compressImage.jsx";


export const fileToBase64Optimized = async (file, options = {}) => {
    const {
        maxWidth = 400,
        quality = 0.8,
        maxSizeKB = 200
    } = options;

    if (!file) {
        throw new Error('No file provided');
    }

    if (!(file instanceof File) && !(file instanceof Blob)) {
        throw new Error('Invalid file type');
    }

    if (!file.type.startsWith('image/')) {
        throw new Error('File is not an image');
    }

    let compressedBlob;
    try {
        compressedBlob = await compressImage(file, maxWidth, quality);
    } catch (error) {
        console.error('Compression failed, using original:', error);
        compressedBlob = file;
    }

    if (compressedBlob.size > maxSizeKB * 1024) {
        throw new Error(`Image size exceeds ${maxSizeKB}KB`);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);

        reader.readAsDataURL(compressedBlob);
    });
};
