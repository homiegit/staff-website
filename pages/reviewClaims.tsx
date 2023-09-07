import { client } from '../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';

import { IVideo, IUser } from '../../homie-website/types.js'
import VideoCard from '../components/VideoCard';

declare global {
  interface HTMLVideoElement {
    setplaying: (playing: boolean) => void;
    videoId: string;
  }
  interface UserElement {
    userName: string;
  }
}

interface IProps {
  videos: IVideo[];
  users: IUser[];
}

interface TranscriptionItem {
  alternatives: { confidence: number; content: string }[];
  start_time: number;
  end_time: number
}
const reviewer = 'diego'
const EditClaims: React.FC<IProps> = ({ videos, users }: IProps) => {
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const userRefs = useRef<UserElement[]>([]);
  const [currentRef, setCurrentRef] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [loop, setLoop] = useState(true);
  const [videoDurations, setVideoDurations] = useState<Array<string | null>>([]);

  const currentVideo = videoRefs.current[currentRef];
  const currentUser = userRefs.current[currentRef];

  const [scrubTime, setScrubTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [newCirclePosition, setNewCirclePosition] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressContainerWidth, setProgressContainerWidth] = useState<number>(0);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const [highlightedTranscription, setHighlightedTranscription] = useState<string[]>([]);
  const [fullTranscription, setFullTranscription] = useState<{ index: number; transcriptionItems: TranscriptionItem[] }[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [currentWord, setCurrentWord] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();

  const onVideoPress = async(index: number) => {
    console.log("index:", index)

    const yourTranscriptionItemsArray = videos[index].cues.map((cue) => ({
      alternatives: cue.alternatives.map((alternative) => ({
        confidence: alternative.confidence,
        content: alternative.content // Assuming alternative.content is a string
      })),
      start_time: cue.start_time,
      end_time: cue.end_time
    }));
  
    setFullTranscription(prevTranscription => [
      ...prevTranscription,
      { index: index, transcriptionItems: yourTranscriptionItemsArray }
    ]);

    if (!currentVideo) {
      return;
    }

    if (index === currentRef) {
      // Play or pause the current video
      if (currentVideo?.getAttribute('data-playing') === 'true') {
        currentVideo?.pause();
        currentVideo?.setAttribute('data-playing', 'false');
        setPlaying(false);
        console.log('playing false')
      }
          
      else if (currentVideo?.getAttribute('data-playing') === 'false') {
      console.log("currentVideo", currentVideo )
      console.log("currentUser", currentUser )

      currentVideo?.play();
      currentVideo?.setAttribute('data-playing', 'true');
      setPlaying(true);
      console.log("playing true")
      }
    } else {
      setCurrentRef(index);
    }
    setCurrentRef(index);
  };

  useEffect(() => {
    // Pause all other videos on the page
    const videos = document.getElementsByTagName('video');
    for (let i = 0; i < videos.length; i++) {
      if (videos[i] !== currentVideo) {
        videos[i].pause();
        videos[i].setAttribute('data-playing', 'false');
        setPlaying(false);
      }
    }
  
  }, [currentRef])
  
  function updateProgress() {
    if (currentVideo) {
      const progressPercent = (currentVideo?.currentTime / currentVideo?.duration) * 100;
      setProgress(progressPercent);
    }
    if (circleRef.current && newCirclePosition !== null) {
      circleRef.current.style.left = `${newCirclePosition}px`;
    }
  }

  useEffect(() => {
    if (videoDurations.length === 0) {
      fetchVideoDurations()
    }
  }, [])

  const fetchVideoDurations = async() => {
    const promises = videos.map((video: IVideo, index: number) => handleVideoLoadedMetadata(index))
    const durationsArray = await Promise.all(promises)

    console.log("promises:", promises);
    console.log("durationsArray:", durationsArray);
    setVideoDurations(durationsArray)
  }

  const handleVideoLoadedMetadata = async(index: number) => {
    const duration = formatDuration(videoRefs.current[index].duration);
    return duration
    // setVideoDurations(prevDurations => {
    //   const newDurations = [...prevDurations];
    //   newDurations[index] = duration;
    //   return newDurations;
    // });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60); // Ensure remaining seconds is an integer
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
    currentVideo?.play();
    setPlaying(true);
  }

  useEffect(() => {
    console.log("currentRef:", currentRef);
    console.log("fullTranscription[currentRef]:", fullTranscription.find(item => item.index === currentRef));
  
    const handleTimeUpdate = () => {
      if (currentVideo?.currentTime) {
        const currentTranscription = fullTranscription.find(item => item.index === currentRef);
        if (currentTranscription) {
          const currentIndex = currentTranscription.transcriptionItems.findIndex(
            (item) =>
              item.start_time <= currentVideo?.currentTime && currentVideo?.currentTime < item.end_time
          );
  
          setCurrentWordIndex(currentIndex);
        }
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
    if (currentWordIndex >= 0 && currentWordIndex < (fullTranscription[currentRef]?.transcriptionItems.length || 0)) {
      const currentTranscription = fullTranscription.find(item => item.index === currentRef);
      if (currentTranscription) {
        const currentword = currentTranscription.transcriptionItems[currentWordIndex].alternatives[0].content;
        setCurrentWord(currentword);
      }
    }
  }, [currentWordIndex, fullTranscription, currentRef]);
  
  useEffect(() => {
    console.log("currentWordIndex:", currentWordIndex, videos[currentRef]?.cues[currentWordIndex]?.alternatives[0].content);
    console.log("currentWord:", currentWord);

  }, [currentWordIndex, currentWord]);
  
  const handleSearchTranscription = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setSearchTerm(search.toLowerCase());

    if (search === '') {
      setSearchTerm('')
      setHighlightedTranscription([])
      return;
    }

    let matchedWords: string[] = [];

      matchedWords = videos[currentRef]?.cues.flatMap((cue) =>
        cue.alternatives
          .map((item) => item.content.toLowerCase()) // Get an array of content values in lowercase
          .filter((content) => content.includes(searchTerm)) // Filter for matching content
      );
     
    setHighlightedTranscription(matchedWords);
  };

  useEffect(() => {
    console.log("highlightedTranscription:", highlightedTranscription)
  }, [highlightedTranscription])

  const createClaimsReview = async(videoId: string) => {
    const video = await client.fetch(`*[_id == '${videoId}'][0]{
      claims
    }`)
    console.log("video.claims:", video.claims);

    if (video?.allClaims?.staffReviewedClaims?.find((review: any) => review.reviewedBy === reviewer)) {
      console.log("no need to create item")
      return;
    }

    const newClaimReview = {
      reviewedBy: reviewer,
      claims: [],
      isPending: true,
      _key: uuidv4()
    }

    let newClaimReviews = [newClaimReview]
    if (video?.allClaims?.staffReviewedClaims?.length !== 0 && video?.allClaims?.staffReviewedClaims !== null && video?.allClaims?.staffReviewedClaims?.length !== undefined && video) {


      newClaimReviews = [
        ...video.claims?.staffReviewedClaims,
        newClaimReview
      ]
    }
    console.log("newClaimReviews:", newClaimReviews);

    await client.patch(videoId).set({claims: {staffReviewedClaims: newClaimReviews}}).commit()
  }
  return (
    <div style={{backgroundColor: 'black'}}>
      <h3>
      
      </h3>
      <div>
          <h1 style={{color: 'white', fontSize: 30}}>
            Videos waiting for claims to be review
          </h1>
          {videos.map((video, index) => {
            const now = new Date();
            const createdAt = new Date(video.createdAt);
            const timeDifference = Math.floor((now.getTime() - createdAt.getTime()) / 1000); // Calculate time difference in seconds
          
            console.log("createdAt:", createdAt)
            console.log("timeDifference:", timeDifference)
            let timeAgo;
          
            if (timeDifference < 60) {
              timeAgo = `${timeDifference} seconds`;
            } else if (timeDifference < 3600) {
              const minutes = Math.floor(timeDifference / 60);
              timeAgo = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
            } else if (timeDifference < 86400) {
              const hours = Math.floor(timeDifference / 3600);
              const remainingMinutes = Math.floor((timeDifference % 3600) / 60);
              timeAgo = `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;
            } else {
              const days = Math.floor(timeDifference / 86400);
              const hours = Math.floor((timeDifference % 86400) / 3600);
              timeAgo = `${days} ${days === 1 ? 'day' : 'days'} and ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
            }
            
            const hasReviewerReviewed = video?.allClaims?.staffReviewedClaims
            ? video?.allClaims?.staffReviewedClaims.find(review => review.reviewedBy === reviewer)
            : undefined;
          
            const isPending = hasReviewerReviewed ? hasReviewerReviewed.isPending : undefined;

            const nonPendingStaffReviewedClaims = video?.allClaims?.staffReviewedClaims?.filter(
              (review) => review.isPending === false
            );
            
            const remainingReviews = Math.max(10 - (nonPendingStaffReviewedClaims?.length || 0), 0);
            
            return (
              <div key={video._id} style={{display: 'flex', flexDirection: 'row'}}>
                <div style={{display: 'flex', flexDirection: 'column', height: 350, padding: 20}}>
                {/* <VideoCard video={videos[currentRef]} user={users[currentRef]} /> */}

                  <button onClick={() => onVideoPress(index)}>
                    <video
                      id={video._id}
                      loop={loop}
                      ref={(el) => {
                        if (el) {
                          // Attach the video element to the currentVideo array using the currentRef index
                          videoRefs.current[index] = el;
                        }
                      }}
                      src={video.videoUrl ? video.videoUrl : ''}
                      data-playing={playing}
                      style={{width: 114, height: 200, backgroundColor: 'black'}}
                      onTimeUpdate={updateProgress}
                      //onLoadedMetadata={() => handleVideoLoadedMetadata(index)}
                    />
                  </button>
                  <div style={{color: 'white', alignSelf: 'center', fontSize: 25}}>
                  {videoDurations[index]}
                  </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                  <div style={{display: 'flex', flexDirection: 'row', alignSelf: 'center'}}>
                    <form style={{width: 200, height: 15, alignSelf: 'center', paddingBottom: 5}}>
                      <input 
                        style={{width: 200, height: 15, alignSelf: 'center', textAlign: 'center', backgroundColor: 'black', borderColor: 'white', borderWidth: 2, color: 'white'}}
                        onChange={handleSearchTranscription}
                    >
                      </input>
                    </form>
                    <p style={{fontSize: 20, position: 'absolute', top: 54, right: 280, color: '#F6E05E'}}>{highlightedTranscription.length}</p>
                  </div>
                  <div style={{fontSize: 17, width: 400, height: 150, overflow: 'auto'}}>
                    {video?.cues?.map((item, idx) => {
                      const matchedWord = highlightedTranscription.includes(item.alternatives[0].content);
                      const isCurrentWord = idx === currentWordIndex;
                      return (
                        <span
                          key={idx}
                          onClick={() => playWord(item.start_time)}
                          style={{
                            cursor: "pointer",
                            color: isCurrentWord || matchedWord ? 'black' : 'white',
                            backgroundColor: isCurrentWord ? 'rgb(0, 183, 255)' : matchedWord ? '#F6E05E' : 'transparent',
                            }}
                          className="hover:text-rgb(0, 183, 255) text-white"
                        >
                          {item.alternatives[0].content}{" "}
                        </span>
                      );
                    }
                    )}
                  </div>
                  <div style={{color: 'white', fontSize: 25}}>
                    <div style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                    {video?.allClaims?.chatGptClaims?.length} Claims
                      <div style={{fontSize: 15, alignSelf: 'center'}}>
                        by ChatGPT
                      </div>
                    </div>
                    <div style={{color: 'white', fontSize: 20, width: 400, height: 150, overflow: 'auto'}}>
                    {video?.allClaims?.chatGptClaims?.map((claim, index) => (
                      <div style={{paddingBottom: 15}} key={index}>
                        {claim}
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', width: 100, height: 200}}>
                  <div style={{}}>
                    <button
                      onClick={async() => {
                        !isPending ? router.push(`/claimsReview/allStaffReviewedClaims/${video._id}`) :
                        await createClaimsReview(video._id)
                        const videoObject = {
                          videoUrl: video.videoUrl,
                          videoId: video._id,
                        };
                        const videoParam = encodeURIComponent(JSON.stringify(videoObject));
                        router.push(`/claimsReview/${videoParam}`);                  
                        // <VideoId video={video} user={users[currentRef]}/>
                      }}
                      style={{
                        width: 100,
                        height: 50,
                        fontSize: 20,
                        backgroundColor: isPending !== undefined ? (isPending ? 'yellow' : 'rgb(0, 183, 255)') : 'white'
                      }}
                      className='hover:bg-blue'
                      //disabled={isPending !== undefined ?!isPending : false}
                    >
                      {isPending !== undefined ? 
                      (isPending ? 'Continue': 'Done') : 'Review'}
                      
                    </button>
                    
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <div style={{}}>
                      <p style={{fontSize: 20, color: 'white', textAlign: 'center'}}>
                      {remainingReviews} more reviews left
                      </p>
                    </div>
                    <div style={{ color: 
                      timeDifference > 21600 ? 'red' :
                      timeDifference > 3600 ? 'orange' :
                      timeDifference > 1800 ? 'green' :
                      'green'
                    }}
                    >
                      {timeAgo} ago
                    </div>
                  </div>
                </div>

              </div>
            )
          })}
      </div>
    </div>   
  );
}

export default EditClaims;

export async function getServerSideProps() {
  const pendingVideos = await client.fetch(`*[_type == 'video' && isAboutGod == true && areClaimsReviewed == false]{
    videoUrl,
    allClaims,
    cues,
    _id,
    createdAt
  } | order(createdAt asc)`);

  // const userRefs = pendingVideos.map((video: any) => video.postedBy._ref);
  
  // const userPromises = userRefs.map((userRef: string) =>
  //   client.fetch(`*[_id == '${userRef}']`)
  // );

  // const users = await Promise.all(userPromises);

  console.log("pendingVideos:", pendingVideos);
  //console.log("users:", users);

  const props = {
    videos: pendingVideos || [],
    //users: users || []
  };

  return {
    props,
  };
};


  