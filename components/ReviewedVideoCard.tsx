import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { IVideo, IUser } from '../../homie-website/types.js'
import Link from 'next/link';

interface IProps {
  video: IVideo;
  user: IUser;
}

interface TranscriptionItem {
  alternatives: { confidence: number; content: string }[];
  start_time: number;
  end_time: number
}

const ReviewedVideoCard: React.FC<IProps> = ({video, user}: IProps) => {
  // console.log('video in videocard', video);
  // console.log('user in videocard', user);
  if (video === null || user === null) {
    // Handle the loading state or absence of data
    return <div>Loading...</div>;
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideo = videoRef.current;
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [videoDuration, setVideoDuration] = useState<string | null>('');
  const [newCirclePosition, setNewCirclePosition] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const circleRef = useRef<HTMLDivElement>(null);

  const [highlightedTranscription, setHighlightedTranscription] = useState<string[]>([]);
  const [fullTranscription, setFullTranscription] = useState<TranscriptionItem[]>();
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [currentWord, setCurrentWord] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isUserNameHovered, setIsUserNameHovered] = useState(false);

  function updateProgress() {
    const currentVideo = videoRef.current;
    if (currentVideo) {
      const progressPercent = (currentVideo.currentTime / currentVideo.duration) * 100;
      setProgress(progressPercent);
    }
    if (circleRef.current && newCirclePosition !== null) {
      circleRef.current.style.left = `${newCirclePosition}px`;
    }
  }

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const currentVideo = e.target as HTMLVideoElement;
    const duration = formatDuration(currentVideo.duration);

    setVideoDuration(duration);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60); // Ensure remaining seconds is an integer
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const onVideoPress = async() => {
    //const user = userRef.current;
    //set(index);

    if (!currentVideo) {
      return;
    }
    // Pause all other videos on the page
    const videos = document.getElementsByTagName('video');
    for (let i = 0; i < videos.length; i++) {
      if (videos[i] !== currentVideo) {
        videos[i].pause();
        videos[i].setAttribute('data-playing', 'false');
      }
    }

    // Play or pause the current video
    if (currentVideo.getAttribute('data-playing') === 'true') {
      currentVideo.pause();
      currentVideo.setAttribute('data-playing', 'false');
      setPlaying(false);
      console.log('playing false')
    }
        
    else if (currentVideo.getAttribute('data-playing') === 'false') {
    console.log("currentVideo", currentVideo )
    //console.log("user", user )

    currentVideo.play();
    currentVideo.setAttribute('data-playing', 'true');
    setPlaying(true);
    console.log("playing true")
    }
  };

  const handleSearchTranscription = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    if (search === '') {
      setSearchTerm('')
      setHighlightedTranscription([]);

      return
    }
    setSearchTerm(search.toLowerCase());

    let matchedWords: string[] = [];

      matchedWords = video?.cues.flatMap((cue) =>
        cue.alternatives
          .map((item) => item.content.toLowerCase()) // Get an array of content values in lowercase
          .filter((content) => content.includes(searchTerm)) // Filter for matching content
      );
     
    setHighlightedTranscription(matchedWords);
  };

  function playWord(startTime: number) {

  
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
    console.log(":", );
    //console.log("fullTranscription[]:", fullTranscription?.find(item => item.index === ));
  
    const handleTimeUpdate = () => {
      if (currentVideo?.currentTime && fullTranscription) {
          const currentIndex = fullTranscription?.findIndex(
            (item) =>
              item.start_time <= currentVideo.currentTime && currentVideo.currentTime < item.end_time
          );
  
          setCurrentWordIndex(currentIndex);
        
      }
    };
  
    // Add event listener for time update
    currentVideo?.addEventListener("timeupdate", handleTimeUpdate);
  
    // Clean up the event listener on component unmount
    return () => {
      currentVideo?.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [currentVideo?.currentTime]);

  useEffect(() => {
    if (currentWordIndex >= 0 && currentWordIndex < (fullTranscription?.length || 0) && fullTranscription) {
        const currentWord = fullTranscription[currentWordIndex].alternatives[0].content;
        setCurrentWord(currentWord);
      
    }
  }, [currentWordIndex, fullTranscription]);
  
  useEffect(() => {
    console.log("currentWordIndex:", currentWordIndex);
  
    const yourTranscriptionItemsArray = video?.cues.map((cue) => ({
      alternatives: cue.alternatives.map((alternative) => ({
        confidence: alternative.confidence,
        content: alternative.content // Assuming alternative.content is a string
      })),
      start_time: cue.start_time,
      end_time: cue.end_time
    }));
  
    setFullTranscription(yourTranscriptionItemsArray);
  }, [currentWordIndex]);

  return(
    <div style={{backgroundColor: 'black'}}>
      <div style={{display: 'flex', flexDirection: 'row', width: '100vw', height: '50vh'}}>
        <div style={{display: 'flex', flexDirection: 'column'}}>

          <div
            onMouseEnter={() => setIsUserNameHovered(true)}
            onMouseLeave={() => setIsUserNameHovered(false)}
            >
            <Link href={`/profile/${user?._id}`}>
              <div 
                style={{ color: 'white', textAlign: 'center', fontSize: 20 }}
              >
                {user?.userName}{}
              </div>
            </Link>
            {/* <div>
            {postedByUsers[0]?.isUserReliable?.reliability !== 'pending' && (
              <div>
                {isUserNameHovered && postedByUsers[0]?.isUserReliable?.proof[0]?.text && (
                  <div className={`${homieCheckReliability} text-black w-[200px]`}>
                  {postedByUsers[0]?.isUserReliable?.proof[0]?.text}
                  <div onClick={() => setShowUserSources(true)}
                    className='text-black hover:text-white text-center'> Show Sources
                    </div>
                  {showUserSources && (
                  <div className='text-center'>
                    <a href={`${BASE_URL}/detail/${postedByUsers[0]?.isUserReliable?.proof[0].sources[0].video._ref}`} className='hover:text-primary'>{'post' }</a>
                  </div>
                  )}
                  </div>
                )}
              </div>
            )
            }
            </div> */}
          </div>
          <button onClick={() => onVideoPress()}>

            <video 
              id={video?._id}
              loop={loop}
              ref={videoRef}
              src={video?.videoUrl ? video?.videoUrl : ''}
              data-playing={playing}
              style={{width: '13vw', backgroundColor: 'black'}}
              onTimeUpdate={updateProgress}
              onLoadedMetadata={(e) => handleVideoLoadedMetadata(e)}
            />
          </button>
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', flexDirection: 'row', alignSelf: 'center', position: 'relative'}}>
              <input 
                style={{width: 200, height: 15, alignSelf: 'center', textAlign: 'center', backgroundColor: 'black', borderColor: 'white', borderWidth: 2, color: 'white'}}
                onChange={handleSearchTranscription}
              >
              </input>
            <div style={{fontSize: 20,position: 'absolute', top: 0, right: 0, color: '#F6E05E'}}>{highlightedTranscription.length}</div>
          </div>
          <div style={{fontSize: 17, overflow: 'auto', position: 'relative', padding: 5}}>
            {video?.cues.map((item, index) => {
              const matchedWord = highlightedTranscription.includes(item.alternatives[0].content.toLowerCase());
              const isCurrentWord = index === currentWordIndex; // Check if the current index matches the currentWordIndex
              //log("item.start_time:", item.start_time)
              //log("currentVideo:", currentVideo?.currentTime)
              // if (item.start_time === currentVideo?.currentTime) {
              // log("isCurrentWord:", isCurrentWord)
              // }
              return (
                <span
                  key={index}
                  onClick={() => playWord(item.start_time)}
                  style={{
                    //textDecoration: matchedWord ? "underline" : "",
                    cursor: "pointer",
                    color: isCurrentWord || matchedWord ? 'black' : 'white',
                    backgroundColor: isCurrentWord ? 'rgb(0, 183, 255)' : matchedWord ? '#F6E05E' : 'transparent',
                  }}
                  className="hover:text-rgb(0, 183, 255) text-white"
                >
                  {item.alternatives[0].content}{" "}
                </span>
              );
            })}
          </div>
        </div>
        {/* <div style={{color: 'white', fontSize: 20, overflow: 'auto'}}>
          {video?.claims?.map((claim) => (
            <div>
              * {claim}
            </div>
          ))}
          </div> */}
      </div>
    </div>
  );
};

export default ReviewedVideoCard;