import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { CameraIcon } from "../Icons/CamerIcon.jsx";
import { ProfileIcon } from "../Icons/ProfileIcon.jsx";
import { getCroppedImg } from '../../utils/cropImage';

const AvatarUpload = ({ onAvatarChange }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [showFileInfo, setShowFileInfo] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Выберите изображение!');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Максимальный размер - 5MB');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        setSelectedFile(file);
        setShowFileInfo(true);
        setShowCropper(true);
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const applyCrop = async () => {
        if (!preview || !croppedAreaPixels) return;

        setIsCropping(true);
        try {
            const croppedImage = await getCroppedImg(preview, croppedAreaPixels);

            if (preview) URL.revokeObjectURL(preview);
            setPreview(croppedImage.url);

            const croppedFile = new File(
                [croppedImage.blob],
                selectedFile.name,
                { type: 'image/jpeg' }
            );
            setSelectedFile(croppedFile);

            if (onAvatarChange) {
                onAvatarChange(croppedFile);
            }

            setShowCropper(false);
        } catch (error) {
            console.error('Ошибка при кропе:', error);
            alert('Не удалось обрезать изображение');
        } finally {
            setIsCropping(false);
        }
    };

    const handleClear = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setSelectedFile(null);
        setShowFileInfo(false);
        setShowCropper(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        if (onAvatarChange) {
            onAvatarChange(null);
        }
    };

    const cancelCrop = () => {
        setShowCropper(false);
    };

    React.useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    return (
        <div className="flex flex-col items-center space-y-4">
            {showCropper && (
                <div className="fixed inset-0 z-[20] flex items-center justify-center p-4 bg-black bg-opacity-70">
                    <div className=" bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-semibold">Обрезка фотографии</h3>
                            <button
                                onClick={cancelCrop}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
                                <Cropper
                                    image={preview}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Масштаб: {zoom.toFixed(1)}x
                                    </label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={cancelCrop}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700
                                                 rounded-[40px] hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="button"
                                        onClick={applyCrop}
                                        disabled={isCropping}
                                        className="flex-1 px-4 py-2.5 bg-black text-white
                                                 rounded-[40px] hover:bg-gray-800 transition-colors
                                                 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {isCropping ? 'Обрезка...' : 'Применить обрезку'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative">
                <div
                    className="w-48 h-48 rounded-full border-4 border-gray-200
                               overflow-hidden cursor-pointer shadow-lg
                               hover:border-gray-300 transition-all duration-300"
                    onClick={() => fileInputRef.current.click()}
                >
                    {preview ? (
                        <img
                            src={preview}
                            alt="Аватарка"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center
                                        justify-center bg-gray-100 text-gray-400">
                            <ProfileIcon size="60" strokeColor="gray"/>
                            <span className="text-sm mt-2">Добавить фото</span>
                        </div>
                    )}
                </div>


                <div
                    className="absolute bottom-2 right-2 w-10 h-10 bg-gray-800
                               rounded-full flex items-center justify-center
                               cursor-pointer shadow-lg hover:bg-gray-700
                               transition-colors border-2 border-white"
                    onClick={() => fileInputRef.current.click()}
                >
                    <CameraIcon color="#FFFFFF" />
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />

            <div className={`text-center space-y-2 transition-all duration-300 
                           ${showFileInfo ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <div className="text-sm text-gray-600">
                    <p className="font-medium truncate max-w-[200px]">{selectedFile?.name}</p>
                    <p className="text-gray-500">
                        {selectedFile && `${(selectedFile.size / 1024).toFixed(1)} KB`}
                        {showCropper && " • Настройте обрезку"}
                    </p>
                </div>

                <div className="flex justify-center space-x-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="px-4 py-1.5 bg-black text-white text-sm rounded-[40px]
                                  hover:bg-gray-800 transition-colors"
                    >
                        {preview ? 'Изменить' : 'Выбрать'}
                    </button>

                    {preview && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm
                                      rounded-[40px] hover:bg-gray-50 transition-colors"
                        >
                            Удалить
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvatarUpload;