import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactLoading from 'react-loading'
import TranscribeService from 'aws-sdk/clients/transcribeservice';
import AWS from 'aws-sdk';
import { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_OUTPUT_BUCKET_NAME, SERVER_IP_URL } from '../../homie-website/config';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import axios from 'axios';
import { indexOf } from 'lodash';
import { lesson1 } from '../videoObjects';
import os from 'os';
import path from 'path';

// AWS.config.update({ region: 'us-west-2' });
// AWS.config.credentials = new AWS.Credentials({
//   accessKeyId: AWS_ACCESS_KEY,
//   secretAccessKey: AWS_SECRET_ACCESS_KEY
// });
// const s3 = new AWS.S3();
// const transcribeService = new TranscribeService({ region: 'us-west-2' });

interface IVideo {
  _id: string;
  videoUrl: string;
  //transcriptionResults: string;
  cues: Items[];
  transcription: string;
}

interface Items {
  alternatives: { confidence: any; content: string }[];
  start_time?: any;
  end_time?: any;
}

interface VideoAsset {
  originalFilename: string;
  mimeType: string;
  url: string;
  extension: string;
}

interface HighlightedWord {
  word: string;
  index: number;
}

const VideoCard = () => {
  const [videoBuffer, setVideoBuffer] = useState<Buffer | null>(null);
  const [video, setVideo] = useState<IVideo>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [highlightedTranscription, setHighlightedTranscription] = useState<HighlightedWord[]>([]);
  const [highlightedWord, setHighlightedWord] = useState<HighlightedWord>();
  const [fullTranscription, setFullTranscription] = useState<Items[]>();
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [matchedIndexes, setMatchedIndexes] = useState<number[]>([]);
  const [currentMatchedWordIndex, setCurrentMatchedWordIndex] = useState(0);

  const [currentWord, setCurrentWord] = useState('');
  const [searchTerm, setSearchTerm] = useState<string[]>([]);

  const supportedTranscribeTypes = ["amr", "flac", "wav", "ogg", "mp3", "mp4", "webm"]
  const [videoAsset, setVideoAsset] = useState<VideoAsset>();
  const containerRef = useRef<HTMLDivElement | null>(null); // Specify the type explicitly

  // const onDrop = useCallback((acceptedFiles: any) => {
  //   const file = acceptedFiles[0];

  //   if (file) {
  //     setVideoAsset({
  //       url: URL.createObjectURL(file),
  //       originalFilename: file.name,
  //       extension: file.name.split('.').pop(),
  //       mimeType: file.type,
  //     });
  //   }
  // }, []);

  // const { getRootProps, getInputProps } = useDropzone({
  //   onDrop,
  //   maxFiles: 1,
  // });

  const onVideoPress = () => {
    const currentVideo = videoRef.current
    if (playing) {
      currentVideo?.pause();
      currentVideo?.setAttribute('data-playing', 'false');

    } else if (!playing) {
      currentVideo?.play();
      currentVideo?.setAttribute('data-playing', 'true');

    }
    setPlaying(!playing);
  };

  const handleLoadVideo = async() => {
    console.log('filePath');

   const filePath = path.join(os.homedir(),'Downloads','lesson1-480p');
   console.log('filePath:', filePath)

    fetch(filePath)
      .then((response) => response.blob()) // Get the file data as a Blob
      .then((fileBlob) => {
    // Create a URL from the Blob
        const url = URL.createObjectURL(fileBlob);

        setVideo({videoUrl: url, transcription: lesson1.results.transcripts[0].transcript, _id: uuidv4(), cues: lesson1.results.items})
      })
      .catch((error) => {
        console.error('Error fetching the file:', error);
      });
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('file:', file);
  
    if (file) {
      const reader = new FileReader();
      const url = URL.createObjectURL(file);
      const originalFilename = file.name;
      const mimeType = file.type;
      const extension = originalFilename.split('.').pop() || '';

      if (originalFilename === 'lesson1-480p.mp4') {
        setVideo({videoUrl: url, transcription: lesson1.results.transcripts[0].transcript, _id: uuidv4(), cues: lesson1.results.items})
        return;
      }
  
      reader.onload = (event) => {
        const result = event.target?.result;
        if (result instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(result);
          const buffer = Buffer.from(uint8Array); // Convert Uint8Array to Buffer
          setVideoBuffer(buffer);
        }
      };
  
      setVideoAsset({
        url: url,
        originalFilename: originalFilename,
        mimeType: mimeType,
        extension: extension,
      });
  
      reader.readAsArrayBuffer(file);
    }
  };
  
  useEffect(() => {
    if (videoAsset && videoBuffer) {
      console.log('videoAsset:', videoAsset);
      console.log('videoBuffer:', videoBuffer?.length); 
  
      const formData = new FormData();
      // Append the entire videoAsset object as a JSON string
      formData.append('videoAsset', JSON.stringify(videoAsset));
      
      // Append the videoBuffer as a Blob
      const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
      formData.append('videoBuffer', videoBlob, 'video.mp4');
  
      axios.post(`${SERVER_IP_URL}/transcribe`, formData)
        .then(response => {
          // Handle the response here
          console.log('response:', response);

          setVideo(response.data as IVideo);
        })
        .catch(error => {
          console.error('Error during transcription:', error);
          // Handle the error here
        });
    }
  }, [videoAsset, videoBuffer]);
  
  function updateProgress() {
    const currentVideo = videoRef?.current;

    if (currentVideo) {
      //console.log(currentVideo)
      const progressPercent = (currentVideo.currentTime / currentVideo.duration) * 100;
      setProgress(progressPercent);
    }
    // if (circleRef.current && newCirclePosition !== null) {
    //   circleRef.current.style.left = `${newCirclePosition}px`;
    // }

    if (currentVideo?.currentTime && fullTranscription) {
      //console.log(currentVideo.currentTime)
      const currentIndex = fullTranscription?.findIndex(
        (item) =>
          item.start_time <= currentVideo.currentTime && currentVideo.currentTime < item.end_time
      );

      setCurrentWordIndex(currentIndex);
    
    }
  };
  
  const handleSearchTranscription = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const search = e.target.value; // Remove leading/trailing spaces
    
    if (search === '') {
      setCurrentMatchedWordIndex(0);
      setSearchTerm([]);
      setHighlightedTranscription([]);
      return;
    }
  
    const searchTermsArray = search.toLowerCase().split(/\s+/); // Split by spaces
    
    setSearchTerm(searchTermsArray);
  
   // const matchedWords: any = [];
  
    // video?.cues.forEach((cue) => {
    //   cue.alternatives.forEach((item: any, index: any) => {
    //     const content = item.content.toLowerCase();

    //     // Check if the content starts with any of the search terms
    //     if (searchTermsArray.some((searchTerm) => {
    //       return content.startsWith(searchTerm);
    //     })) {
    //       matchedWords.push(content);


    //          if (content.startsWith(searchTermsArray[searchTermsArray.length - 1]) ) {
    //           matchedWords.push(content);
    //         } else if (!searchTermsArray[searchTermsArray.length - 1].startsWith(cue.alternatives[index + 1]?.content) && content !== searchTermsArray[searchTermsArray.length - 2]) {
    //           matchedWords.pop();

    //         }
    //     }
    //   });
    // });

    let matchedWords = video?.cues?.filter((cue) =>
      cue.alternatives.some(
        (item) => item.content.toLowerCase().startsWith(search.toLowerCase())
      )
    );

    if (search.endsWith(' ') && search.split(/\s+/).length < 1) {
      console.log('ends with space');
      matchedWords = video?.cues?.filter((cue) =>
      cue.alternatives.some(
        (item) => item.content.toLowerCase() === (search.toLowerCase().trim())
      )
      );
    }
    if (search.includes(' ') && !search.endsWith(' ')) {
      console.log('multiple words');

      const searchPhrase = search.split(/\s+/);
      console.log('searchPhrase', searchPhrase);

      matchedWords = video?.cues?.filter((cue) =>
        cue.alternatives.some(
          (item) => {
            if (item.content.toLowerCase().startsWith(searchPhrase[searchPhrase.length - 1])) {
              return searchPhrase[searchPhrase.length - 1]
            } else {
              return searchPhrase.some((phrase) =>
              item.content.toLowerCase() === (phrase)
              );
            }
          }
        )
      );

      // const matchedPhrases = matchedWords?.map((cue) => {
      //   const lowercaseContent = cue.alternatives[0].content.toLowerCase();
      //   return searchPhrase.filter((phrase) =>
      //     lowercaseContent.includes(phrase)
      //   );
      // });
    } else if (search.split(/\s+/).length > 1 && search.endsWith(' ')) {
      const searchPhrase = search.split(/\s+/);
      console.log('searchPhrase / multiple words & ends with space', searchPhrase);

      matchedWords = video?.cues?.filter((cue) =>
      cue.alternatives.some(
        (item) => {
          if (item.content.toLowerCase() === (searchPhrase[searchPhrase.length - 2])) {
            return searchPhrase[searchPhrase.length - 2]
          } else {
            return searchPhrase.some((phrase) =>
            item.content.toLowerCase() === (phrase)
            );
          }
        }
      )
    );
    }
  if (matchedWords && matchedWords.length > 0) {
    setCurrentMatchedWordIndex(0); // Start from the first match
    setHighlightedTranscription(matchedWords.map((cue, index) => {return {word: cue.alternatives[0].content.toLowerCase(), index: index}})
    );
  } else {
    setCurrentMatchedWordIndex(0); // No matches found, start from the beginning
    setHighlightedTranscription([]);
  }
      //setHighlightedTranscription(matchedWords);
          console.log('matchedWords:', matchedWords);

  };

  useEffect(() => {
    console.log('highlightedTranscription:', highlightedTranscription);

  }, [highlightedTranscription])
  

  function playWord(startTime: number) {
    const currentVideo = videoRef?.current;

    if (!currentVideo) {
      return;
    }
    const videos = document.getElementsByTagName('video');
    for (let i = 0; i < videos.length; i++) {
  
        videos[i].pause();
        videos[i].setAttribute('data-playing', 'false');
    }
    currentVideo.dataset.playing = 'true';
  
    currentVideo.currentTime = startTime;
    currentVideo.play();
    setPlaying(true);
  }

  useEffect(() => {
    //console.log("video:", video)
    
    //setCurrentWordIndex(0);
  }, [video])

  useEffect(() => {
    const currentVideo = videoRef.current;

    if (currentVideo?.currentTime && fullTranscription) {
      const currentIndex = fullTranscription.findIndex(
        (item) =>
          item.start_time <= currentVideo.currentTime && currentVideo.currentTime < item.end_time
      );

      setCurrentWordIndex(currentIndex);
    }
  }, [videoRef.current, fullTranscription]);

  useEffect(() => {
    if (currentWordIndex >= 0 && currentWordIndex < (fullTranscription?.length || 0) && fullTranscription) {
      const currentWord = fullTranscription[currentWordIndex].alternatives[0].content;
      setCurrentWord(currentWord);
    }
  }, [currentWordIndex, fullTranscription]);

  useEffect(() => {
    const yourTranscriptionItemsArray = video?.cues?.map((cue) => ({
      alternatives: cue.alternatives.map((alternative) => ({
        confidence: alternative.confidence,
        content: alternative.content // Assuming alternative.content is a string
      })),
      start_time: cue.start_time,
      end_time: cue.end_time
    }));

    setFullTranscription(yourTranscriptionItemsArray);
  }, [video?.cues]);

 
  const scrollToMatchedWord = (direction: any) => {
    const container = containerRef.current;
    if (!container || !video) return;
  
    const spans = container.querySelectorAll('span');
    //const totalMatches = highlightedTranscription.length;
  
    // Find the index to scroll to based on direction
    let newIndex;
  
    if (direction === 'up') {
      // Scroll to the previous index that exists in highlightedTranscription
      newIndex = currentMatchedWordIndex - 1;
      while (newIndex >= 0 && !highlightedTranscription[newIndex]) {
        newIndex--;
      }
      if (newIndex < 0) {
        newIndex = 0;
      }
    } else if (direction === 'down') {
      // Scroll to the next index that exists in highlightedTranscription
      newIndex = currentMatchedWordIndex + 1;
      while (newIndex >= 0 && !highlightedTranscription[newIndex]) {
        newIndex++;
      }
    }

    if (!newIndex) {
      return
    }
  
    // Get the index from highlightedTranscription
    const indexToScroll = highlightedTranscription[newIndex].index;
  
    // Check if the index is valid
    if (indexToScroll >= 0 && indexToScroll < spans.length) {
      spans[indexToScroll].scrollIntoView({ behavior: 'smooth' });
      setCurrentMatchedWordIndex(newIndex);
    }
  };
  
  
  
return(
  <div style={{backgroundColor: 'white'}}>
    <div style={{display: 'flex', flexDirection: 'row', width: '100vw', height: '50vh'}}>
      {!videoAsset && !video && (
        <>
        {/* <div {...getRootProps()} style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}>
          <input {...getInputProps()} />
          <p>Drag & drop a video file here, or click to select one.</p>
        </div> */}
        <input type="file" accept="video/quicktime, video/mp4, video/ogg, video/webm, audio/mp3, audio/ogg, audio/amr, audio/webm, audio/wav, audio/flac, audio/x-m4a" onChange={handleFileUpload} />

      </>
      )}
      {/* {!video && 
        <>
        <button
          onClick={() => handleLoadVideo()}
        >
          lesson1
        </button>
        </>
      
      } */}
      {videoAsset && !video && (
      <ReactLoading type={'spin'} color={'#0073e6'} height={'10%'} width={'10%'} />

      )}
      {video && (
        <>
        <div style={{display: 'flex', flexDirection: 'row'}}>
          {/* {videoAsset?.originalFilename} */}
          <button 
            onClick={() => onVideoPress()}
            className='bg-red'
          >

            <video 
              id={video?._id}
              loop={loop}
              ref={videoRef}
              src={videoAsset ? videoAsset.url : video.videoUrl}
              data-playing={playing}
              style={{width: '60vw', backgroundColor: 'white'}}
              onTimeUpdate={updateProgress}
              //onLoadedMetadata={(e) => handleVideoLoadedMetadata(e)}
            />
            </button>
            {/* <div style={{color: 'white', fontSize: 20, alignSelf: 'center'}}>
              {formatDateToMMDDYYYY(video?._createdAt)}
            </div> */}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', width: '37vw', height: '50vh', borderColor: 'rgb(0, 183, 255)', borderStyle: 'solid', borderWidth: 2}}>
          <div style={{display: 'flex', flexDirection: 'row', alignSelf: 'center', position: 'relative'}}>
            <input 
              style={{width: 200, height: 15, alignSelf: 'center', textAlign: 'center', backgroundColor: 'white', borderColor: 'rgb(0, 183, 255)', borderWidth: 2, color: 'black'}}
              onChange={handleSearchTranscription}
            >
            </input>
            <div style={{fontSize: 20,position: 'absolute', top: 0, right: 10, color: 'rgb(0, 183, 255)'}}>{highlightedTranscription.length}</div>
          </div>
          <div
            style={{fontSize: 17, overflow: 'auto', position: 'relative', padding: 5}}
            ref={containerRef}>
            {video?.cues?.map((item, index) => {
              const matchedWord = highlightedTranscription.some((highlightedItem) => highlightedItem.word.includes(item.alternatives[0].content.toLowerCase()));
              
              const isCurrentWord = index === currentWordIndex; // Check if the current index matches the currentWordIndex

              return (
                <span
                  key={index}
                  onClick={() => playWord(item.start_time ? item.start_time : video.cues[index + 1].start_time)}
                  style={{
                    //textDecoration: matchedWord ? "underline" : "",
                    cursor: "pointer",
                    color: isCurrentWord || matchedWord ? 'black' : 'black',
                    backgroundColor: isCurrentWord ? 'rgb(0, 183, 255)' : matchedWord ? '#F6E05E' : 'transparent',
                  }}
                  className="hover:text-rgb(0, 183, 255) text-black"
                >
                  {item.alternatives[0].content}{" "}
                </span>
              );
            })}
          </div>
          <button onClick={() => scrollToMatchedWord('up')}>Scroll Up</button>
          <button onClick={() => scrollToMatchedWord('down')}>Scroll Down</button>

        </div>
        
        </>
      )}
      </div>
    </div>
  );
};

export default VideoCard;

