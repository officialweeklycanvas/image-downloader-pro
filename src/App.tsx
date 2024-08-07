import { useState } from 'react';
import JSZip from 'jszip';
import './App.css';

function App() {
  const [images, setImages] = useState<string[]>([]);
  
  const onClick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) return;
    
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => {
          const imgElements = document.querySelectorAll('img');
          return Array.from(imgElements)
            .filter(
              (img) =>
                img.src &&
                img.naturalWidth > 128 &&
                img.naturalHeight > 128
            )
            .map((img) => img.src);
        }
      },
      (result) => {
        if (result && result[0] && result[0].result) {
          setImages(result[0].result as string[]);
        } else {
          setImages([]); // Handle the case where no images are found or result is undefined
        }
      }
    );
  };
  
  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() as string;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const downloadAllImages = async () => {
    const zip = new JSZip();
    const imgFolder = zip.folder('images');
    
    if(!imgFolder) return
    const fetchImageAsBlob = async (url: string) => {
      const response = await fetch(url);
      return response.blob();
    };
    
    for (const url of images) {
      const blob = await fetchImageAsBlob(url);
      const filename = url.split('/').pop() as string;

      const fileExtension = url.split('.').pop()?.split('?')[0] || '';
      const filenameWithExtension = `${filename}${!fileExtension ? `."jpg"` : ''}`;
      if ("file" in imgFolder) {
        imgFolder.file(filenameWithExtension, blob);
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="App">
      <h1>Image Downloader</h1>
      <button onClick={onClick}>Get Images</button>
      <button onClick={downloadAllImages}>Download All Images</button>
      <div className="image-grid">
        {images.map((src, index) => (
          <div key={index} className="image-container">
            <img src={src} alt={`img-${index}`} className="image" />
            <button onClick={() => downloadImage(src)}>Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
