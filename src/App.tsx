import React, { FC, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { saveAs } from 'file-saver';

export const App: FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>('jpeg');
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);

  // Обработка загрузки изображения
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    setSelectedFile(file);
  };

  // Конвертация изображения
  const handleConvert = async () => {
    if (!selectedFile) return;

    const options = {
      maxSizeMB: 1,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(selectedFile, options);
      const convertedBlob = await imageCompression.getDataUrlFromFile(compressedFile);

      const link = document.createElement('a');
      link.href = convertedBlob;
      link.download = `converted.${outputFormat}`;
      link.click();

      setConvertedFile(compressedFile);
    } catch (error) {
      console.error('Ошибка при конвертации:', error);
    }
  };

  // Сохранение конвертированного файла
  const handleDownload = () => {
    if (convertedFile) {
      saveAs(convertedFile, `converted.${outputFormat}`);
    }
  };

  return (
    <div className="app">
      <h1>Конвертер изображений</h1>
      <div className="converter-container">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {selectedFile && (
          <div>
            <label>Выберите формат:</label>
            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WEBP</option>
            </select>
            <button className="convert-button" onClick={handleConvert}>Конвертировать</button>
          </div>
        )}
        {convertedFile && (
          <button className="download-button" onClick={handleDownload}>Скачать изображение</button>
        )}
      </div>
    </div>
  );
};
