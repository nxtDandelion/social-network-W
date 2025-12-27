export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); // Для CORS
        image.src = url;
    });

export const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Размер для аватарки (квадрат)
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Рисуем обрезанное изображение
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size
    );

    // Возвращаем Blob
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve({
                blob,
                url: URL.createObjectURL(blob)
            });
        }, 'image/jpeg', 0.9); // 90% качество
    });
};