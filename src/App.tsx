import React, { FC, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { saveAs } from 'file-saver';

export const App: FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState<string>('jpeg');
  const [convertedFiles, setConvertedFiles] = useState<{ blob: Blob; name: string }[]>([]);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<number[]>([]);

  // Обработка загрузки изображений
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  // Конвертация изображений
  const handleConvert = async () => {
    if (selectedFiles.length === 0) return;

    setIsConverting(true);
    setConversionProgress(new Array(selectedFiles.length).fill(0)); // Инициализируем прогресс

    const options = {
      maxSizeMB: 1,
      useWebWorker: true,
    };

    try {
      const filePromises = selectedFiles.map(async (file, index) => {
        const compressedFile = await imageCompression(file, {
          ...options,
          onProgress: (progress: number) => {
            setConversionProgress(prev => {
              const newProgress = [...prev];
              newProgress[index] = progress;
              return newProgress;
            });
          }
        });

        const convertedBlob = await compressAndConvertImage(compressedFile);
        return { blob: convertedBlob, name: file.name };
      });

      const convertedFiles = await Promise.all(filePromises);
      setConvertedFiles(convertedFiles);
    } catch (error) {
      console.error('Ошибка при конвертации:', error);
    } finally {
      setIsConverting(false);
    }
  };

  // Функция для сжатия и конвертации изображения в указанный формат
  const compressAndConvertImage = (file: File) => {
    return new Promise<Blob>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Ошибка при конвертации изображения'));
                }
              },
              `image/${outputFormat}`,
              0.8
            );
          } else {
            reject(new Error('Не удалось создать контекст канваса'));
          }
        };
        img.src = reader.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Сохранение всех конвертированных файлов
  const handleDownloadAll = () => {
    convertedFiles.forEach((file, index) => {
      const link = document.createElement('a');
      const url = URL.createObjectURL(file.blob);
      link.href = url;
      link.download = `converted_${index + 1}.${outputFormat}`;
      link.click();
      URL.revokeObjectURL(url); // Очистка временного URL
    });
  };

  return (
    <div className="app">
      <h1>Конвертер изображений</h1>
      <div className="converter-container">
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={handleFileChange} 
        />
        {selectedFiles.length > 0 && (
          <div>
            <label>Выберите формат:</label>
            <select 
              value={outputFormat} 
              onChange={(e) => setOutputFormat(e.target.value)}
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WEBP</option>
            </select>
            <button 
              className="convert-button" 
              onClick={handleConvert}
              disabled={isConverting}
            >
              Конвертировать
            </button>
          </div>
        )}
        {isConverting && (
          <div>
            <h2 style={{color: "black"}}>Конвертация...</h2>
            {selectedFiles.map((file, index) => (
              <div key={index} className="progress">
                <span>{file.name}: {conversionProgress[index] || 0}%</span>
                <progress value={conversionProgress[index] || 0} max={100}></progress>
              </div>
            ))}
          </div>
        )}
        {convertedFiles.length > 0 && !isConverting && (
          <button 
            className="download-button" 
            onClick={handleDownloadAll}
          >
            Скачать все изображения
          </button>
        )}
      </div>
    </div>
  );
};
