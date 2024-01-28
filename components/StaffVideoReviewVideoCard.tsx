import React, { useEffect, useRef, useState } from 'react';
import { client } from '../../homie-website/utils/client'
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { IVideo, IUser, IStaff, IStaffVideoReview } from '../../homie-website/types.js'
import Link from 'next/link';
import { Url } from 'next/dist/shared/lib/router/router.js';
import VideoCard from './VideoCard';
import ReviewedVideoCard from './ReviewedVideoCard';

interface IProps {
  reviewObject: IStaffVideoReview
}

interface TranscriptionItem {
  alternatives: { confidence: number; content: string }[];
  start_time: number;
  end_time: number
}

export function formatDateToMMDDYYYY(isoString: string) {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based, so we add 1
  const year = date.getFullYear().toString();

  return `${month}/${day}/${year}`;
}

export const StaffVideoReviewVideoCard : React.FC<IProps> = ({reviewObject}: IProps) => {
  // console.log('video in videocard', video);
  // console.log('user in videocard', user);
  if (reviewObject === null ) {
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
  const [isReviewedByStaffFetched, setIsReviewedByStaffFetched] = useState(false);
  const [isReviewedVideoFetched, setIsReviewedVideoFetched] = useState(false);
  const [staff, setStaff] = useState<IStaff>();
  const [reviewedVideo, setReviewedVideo] = useState<IVideo>();
  const [reviewedVideoUser, setReviewedVideoUser] = useState<IUser>();


  useEffect(() => {
    if (!isReviewedByStaffFetched) {
      fetchStaff()
    }
    if (!isReviewedVideoFetched) {
      fetchReviewedVideo()
    }
  }, [])

  const fetchStaff = async() => {
    const staffUser = await client.fetch(`*[_id == '${reviewObject.reviewedBy._ref}'][0]`);

    setStaff(staffUser);
    setIsReviewedByStaffFetched(true);
  }

  const fetchReviewedVideo = async() => {
    const video = await client.fetch(`*[_id == '${reviewObject.reviewedVideo._ref}'][0]`);
    const user = await client.fetch(`*[_id == '${video.postedBy._ref}'][0]`);

    setReviewedVideo(video);
    setReviewedVideoUser(user);
    setIsReviewedVideoFetched(true);
  }

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

      matchedWords = reviewObject?.cues?.flatMap((cue) =>
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
  
    const yourTranscriptionItemsArray = reviewObject?.cues?.map((cue) => ({
      alternatives: cue.alternatives.map((alternative) => ({
        confidence: alternative.confidence,
        content: alternative.content // Assuming alternative.content is a string
      })),
      start_time: cue.start_time,
      end_time: cue.end_time
    }));
  
    setFullTranscription(yourTranscriptionItemsArray);
  }, [currentWordIndex]);

  const claimColor = (reliability: string) => {
    if (reliability === 'true') {
      return 'aqua'
    }
    if (reliability === 'inaccurate') {
      return 'yellow'
    }
    if (reliability === 'false') {
      return 'red'
    }
    if (reliability === 'unsure') {
      return 'lightgray'
    }
  };

  function formatTimeDifference(_createdAt: Date | string, completedAt: Date | string) {
    console.log('_createdAt:', _createdAt);
    console.log('completedAt:', completedAt);
  
    const createdDate = typeof _createdAt === 'string' ? new Date(_createdAt) : _createdAt;
    const completedDate = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;
  
    const timeDifferenceInMilliseconds = completedDate.getTime() - createdDate.getTime();
    console.log('timeDifferenceInMilliseconds:', timeDifferenceInMilliseconds);
  
    const millisecondsPerMinute = 60 * 1000;
    const millisecondsPerHour = 60 * millisecondsPerMinute;
    const millisecondsPerDay = 24 * millisecondsPerHour;
  
    const days = Math.floor(timeDifferenceInMilliseconds / millisecondsPerDay);
    const hours = Math.floor(
      (timeDifferenceInMilliseconds % millisecondsPerDay) / millisecondsPerHour
    );
    const minutes = Math.floor(
      (timeDifferenceInMilliseconds % millisecondsPerHour) / millisecondsPerMinute
    );
  
    if (days >= 1) {
      return `${days} days and ${hours} hours`;
    } else if (hours >= 1) {
      return `${hours} hours and ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  }
  
  const timeToComplete = (time: string) => {
    if (time.includes('hour') && !time.includes('hours')) {
      return 'green'
    } else {
      return 'red'
    }
  } 
  

  return(
    <div style={{backgroundColor: 'black'}}>
      <div style={{display: 'flex', flexDirection: 'column', width: '100vw', height: '80vh'}}>

        <div style={{display: 'flex', flexDirection: 'row', width: '100vw', height: '70vh'}}>
          <div style={{display: 'flex', flexDirection: 'column', width: '20vw'}}>

            <div
              onMouseEnter={() => setIsUserNameHovered(true)}
              onMouseLeave={() => setIsUserNameHovered(false)}
              >
              <Link href={`/profile/${reviewObject.reviewedBy._ref}`}>
                <div 
                  style={{ color: 'white', textAlign: 'center', fontSize: 20 }}
                >
                  {staff?.userName}{}
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
            {/* <button onClick={() => onVideoPress()}>
              <video 
                id={reviewObject?._id}
                loop={loop}
                ref={videoRef}
                src={reviewObject?.staffVideoUrl ? reviewObject?.staffVideoUrl : ''}
                data-playing={playing}
              // style={{width: '25vw', backgroundColor: 'black'}}
                onTimeUpdate={updateProgress}
                onLoadedMetadata={(e) => handleVideoLoadedMetadata(e)}
              />
            </button> */}
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <div style={{color: 'white', fontSize: 20, alignSelf: 'center'}}>
                Completed on
              </div>
              <div style={{color: 'white', fontSize: 20, paddingBottom: 20}}>
                {formatDateToMMDDYYYY(reviewObject.completedAt)}
              </div>
              <div style={{color: 'white', fontSize: 20, alignSelf: 'center'}}>
                Completed in
              </div>
              <div style={{color: timeToComplete(formatTimeDifference(reviewObject._createdAt,reviewObject.completedAt)), fontSize: 20, paddingBottom: 20}}>
                {formatTimeDifference(reviewObject._createdAt,reviewObject.completedAt)}
              </div>
            <div style={{color: 'white', fontSize: 20, alignSelf: 'center'}}>
              Bible Sources
            </div>
            {reviewObject.bibleSources?.map((source, index) => (
              <div key={index} style={{color: 'white', fontSize: 20, paddingBottom: 20}}>
                * {source.book} {source.chapter} : {source.verse ?? ''}
              </div>
            ))}
            <div style={{color: 'white', fontSize: 20, alignSelf: 'center', paddingBottom: 20}}>
              URL Sources
            </div>
            {reviewObject.urlSources?.map((source, index) => (
              <div key={index} onClick={() => window.open(source.url, '_blank')} style={{color: 'white', fontSize: 20}}>
                * {source.title}
              </div>
            ))}
            </div>
          </div>
            {/* <div style={{display: 'flex', flexDirection: 'column', width: '45vw', height: '70vh'}}>
              <div style={{display: 'flex', flexDirection: 'row', alignSelf: 'center', position: 'relative'}}>
                  <input 
                    style={{width: 200, height: 15, alignSelf: 'center', textAlign: 'center', backgroundColor: 'black', borderColor: 'white', borderWidth: 2, color: 'white'}}
                    // onChange={handleSearchTranscription}
                  >
                  </input>
                <div style={{fontSize: 20,position: 'absolute', top: 0, right: 0, color: '#F6E05E'}}>{highlightedTranscription.length}</div>
              </div>
              <div style={{fontSize: 17, overflow: 'auto', position: 'relative', padding: 5}}>
                {reviewObject?.cues?.map((item, index) => {
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
              <div style={{color: 'white', fontSize: 17, overflow: 'auto', position: 'relative', padding: 5}}>
                {React.createElement('div', {
                  dangerouslySetInnerHTML: { __html: reviewObject.text }
                })}
              </div>
            </div> */}
          <div style={{display: 'flex', flexDirection: 'column', width: '50vw', height: '70vh', overflow: 'auto'}}>
            {reviewObject.claimsReliability.map((claim, index) =>  
              <div key={index}>
                <div style={{color: claimColor(claim.reliability), fontSize: 15}}>
                  {claim.claim}
                </div>
                <div style={{color: claimColor(claim.reliability), fontSize: 20, textAlign: 'center'}}>
                  {claim.reliability}
                </div>
              </div>
            )}
          </div>
        </div>
        {reviewedVideo && reviewedVideoUser && (
        <ReviewedVideoCard video={reviewedVideo} user={reviewedVideoUser} />
        )}
      </div>
    </div>
  );
};
