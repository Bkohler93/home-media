import React, { useState } from "react";
import * as tus from "tus-js-client";

enum UploadState {
  Waiting,
  Uploading,
  Finished,
}

export const Upload: React.FC = () => {
  const [file, setFile] = useState<File | undefined>();
  const [isTvShow, setIsTvShow] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [releaseYear, setReleaseYear] = useState<string>("");
  const [seasonNumber, setSeasonNumber] = useState<string>("");
  const [episodeNumber, setEpisodeNumber] = useState<string>("");
  const [uploadState, setUploadState] = useState<UploadState>(
    UploadState.Waiting
  );
  const [uploadPercentage, setUploadPercentage] = useState<string>("");
  const [basePath, setBasePath] = useState<string>("/movies");

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleReleaseYearChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setReleaseYear(event.target.value);
  };

  const handleSeasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeasonNumber(event.target.value);
  };

  const handleEpisodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEpisodeNumber(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;

    if (!fileList) return;

    setFile(fileList[0]);
  };

  const handleSubmit = () => {
    if (!file) return;

    const metadata: { [key: string]: string } = {
      filename: file.name,
      filetype: file.type,
      name: name,
      releaseYear: releaseYear,
    };

    if (isTvShow) {
      metadata["seasonNumber"] = seasonNumber;
      metadata["episodeNumber"] = episodeNumber;
    }

    const upload = new tus.Upload(file, {
      endpoint: import.meta.env.VITE_BASE_URL + ":8081" + basePath,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: metadata,
      onError: function (error) {
        console.log("Failed because: " + error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        setUploadPercentage(percentage);
      },
      onSuccess: function () {
        setUploadState(UploadState.Finished);
        setUploadPercentage("");
        if (upload.file instanceof File) {
          console.log("Download %s from %s", upload.file.name, upload.url);
        }
      },
    });

    // Check if there are any previous uploads to continue.
    upload.findPreviousUploads().then(function (previousUploads) {
      // Found previous uploads so we select the first one.
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      // Start the upload
      upload.start();
      setUploadState(UploadState.Uploading);
    });
  };

  const handleIsTVShowChange = () => {
    if (isTvShow) {
      setBasePath("/movies");
    } else {
      setBasePath("/tv");
    }
    setEpisodeNumber("");
    setSeasonNumber("");
    setIsTvShow(!isTvShow);
  };

  const handleAnotherUpload = () => {
    setUploadState(UploadState.Waiting);
  };

  return (
    <div className="flex flex-col gap-3">
      <h1>Upload {isTvShow ? "TV Show" : "Movie"}</h1>
      <div className="flex justify-center gap-3">
        <label htmlFor="isTvShow">Is TV Show</label>
        <input
          type="checkbox"
          name="isTvShow"
          onChange={handleIsTVShowChange}
        />
      </div>

      <div className="flex justify-center gap-3">
        <label htmlFor="filePicker">Select file</label>
        <input
          type="file"
          name="filePicker"
          multiple={false}
          onChange={handleFileChange}
        />
      </div>

      <div className="flex justify-center gap-3">
        <label htmlFor="name">Name</label>
        <input type="text" name="name" onChange={handleNameChange} />
      </div>

      {isTvShow && (
        <>
          <div className="flex justify-center gap-3">
            <label htmlFor="season">Season Number</label>
            <input type="text" name="season" onChange={handleSeasonChange} />
          </div>

          <div className="flex justify-center gap-3">
            <label htmlFor="episode">Episode Number</label>
            <input type="text" name="episode" onChange={handleEpisodeChange} />
          </div>
        </>
      )}

      <div className="gap-3 flex justify-center">
        <label htmlFor="releaseYear">Release Year</label>
        <input
          type="text"
          name="releaseYear"
          onChange={handleReleaseYearChange}
        />
      </div>

      {uploadState == UploadState.Uploading ? (
        <h2>{uploadPercentage}%</h2>
      ) : uploadState == UploadState.Waiting ? (
        <button onClick={handleSubmit}>Upload</button>
      ) : (
        <button onClick={handleAnotherUpload}>Upload Another</button>
      )}
    </div>
  );
};
