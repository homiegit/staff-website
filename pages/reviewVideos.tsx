import { client } from '../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';


import { IVideo, IUser, IStaffVideoReview } from '../../homie-website/types.js'
import VideoCard from '../components/VideoCard';
import useAuthStore from '../store/authStore';
import NavBar from '../components/NavBar';
import { indexOf } from 'lodash';

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

const ReviewVideos: React.FC<IProps> = ({ videos, users }: IProps) => {
  const [videoData, setVideoData] = useState<any | []>([]);
  const { userProfile, addUser, removeUser } = useAuthStore();
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const userRefs = useRef<UserElement[]>([]);
  const [currentRef, setCurrentRef] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [loop, setLoop] = useState(true);
  const [videoDurations, setVideoDurations] = useState<Array<string>>([]);

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
  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    // setTimeout(() => {
      setShowNavBar(true);
    // }, 1000)
  }, [videos])

  const onVideoPress = async(index: number, startTime?: number) => {
    console.log("index:", index)

    if (startTime) {
      currentVideo.dataset.playing = 'true';
  
      currentVideo.currentTime = startTime;
    }

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
    if (videoData) {
      //console.log('videoData:', videoData)
      fetchVideoDurations()
    }
  }, [videoData])

  useEffect(() => {
    if (videoDurations.some((duration) => duration === "NaN:NaN")) {
      fetchVideoDurations()
    }
  }, [videoDurations])

  const fetchVideoDurations = async() => {
    const promises = videos?.map((video: IVideo, index: number) => handleVideoLoadedMetadata(index))
    const durationsArray = await Promise.all(promises)

    // console.log("promises:", promises);
    // console.log("durationsArray:", durationsArray);
    setVideoDurations(durationsArray)
  }

  const handleVideoLoadedMetadata = async(index: number) => {
    const duration = formatDuration(videoRefs.current[index]?.duration);
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
  
  function playWord(startTime: number, index: number) {
    const videos = document.getElementsByTagName('video');

    if (!currentVideo) {
      return;
    }

    if (index !== currentRef){
      setCurrentRef(index);
      onVideoPress(index, startTime);
      for (let i = 0; i < videos.length; i++) {
        videos[i].pause();
        videos[i].setAttribute('data-playing', 'false');
      };

      return;
    }

    for (let i = 0; i < videos.length; i++) {
  
        videos[i].pause();
        videos[i].setAttribute('data-playing', 'false');
    }
    currentVideo.dataset.playing = 'true';
  
    currentVideo.currentTime = startTime;
    currentVideo?.play();
    setPlaying(true);
  }

  // useEffect(() => {
  //   currentVideo.dataset.playing = 'true';
  
  //   currentVideo.currentTime = startTime;
  // }, [currentRef])

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

      matchedWords = videos[currentRef].cues.flatMap((cue) =>
        cue.alternatives
          .map((item) => item.content.toLowerCase()) // Get an array of content values in lowercase
          .filter((content) => content.includes(searchTerm)) // Filter for matching content
      );
     
    setHighlightedTranscription(matchedWords);
  };

  useEffect(() => {
    console.log("highlightedTranscription:", highlightedTranscription)
  }, [highlightedTranscription])

  const createReview = async(videoId: string) => {
    // await client.patch("drafts.3709A2D2-F3A1-441C-A38D-C75EC93C5DBD").set({isVideoReliable: {staffReviewReferences: {staffReviewReference: [], isPendingArray: []}}}).commit();

    const video: IVideo = await client.fetch(`*[_id == '${videoId}'][0]{
      isVideoReliable {
        staffReviewReferences
      }
    }`)
    //console.log("video:", video);
    if (!video) {
      console.log("no video:");

      return
    }

    if (video.isVideoReliable && video.isVideoReliable.staffReviewReferences?.find((reference) => reference._ref === userProfile?._id)) {
      console.log("no need to create item")
      return;
    }
    const newUUID = uuidv4()

    const newReview = {
      _type: 'staffVideoReview',
      _id: newUUID,
      reviewedBy: {
        _ref: userProfile?._id
      },
      reviewedVideo: {
        _ref: videoId
      },
      chosenVideoReliability: '',
      claimsReliability: [],
      text: '',
      bibleSources: [],
      urlSources: [],
      isPending: true,
    };

    console.log('creating new review');
    await client.create(newReview);

    const newReference = {
      _ref: newUUID,
      isPending: true
    }
    console.log('newReviewID:', newReview._id);
    console.log('newReferenceID:', newReference._ref);


    let newReferences: IVideo["isVideoReliable"]["staffReviewReferences"] = [newReference]
    if (video.isVideoReliable && video.isVideoReliable.staffReviewReferences?.length !== 0 && video.isVideoReliable.staffReviewReferences ) {
      newReferences = [
        ...video.isVideoReliable.staffReviewReferences,
        newReference
      ]
    
      console.log("newReferences:", newReferences);

      const newIsVideoReliable = {
        reliability: video.isVideoReliable.reliability,
        proof: video.isVideoReliable.proof,
        staffReviewReferences: [
          newReferences
        ],
      }
    

      await client.patch(videoId).set({isVideoReliable: newIsVideoReliable}).commit()
    }
  }

  const handlePush = async(isPending: any, video: IVideo) => {
    // if (isPending === undefined) {
    //   router.push(`/allStaffReviewedClaims/${video._id}`);
    //  }
    if (!isPending) {
      await createReview(video._id)
      const videoObject = {
        videoUrl: video.videoUrl,
        videoId: video._id,
      };
      const videoParam = encodeURIComponent(JSON.stringify(videoObject));
      router.push(`/videoReview/${videoParam}`);  
    } else if (isPending){
      const referenceId = video.isVideoReliable?.staffReviewReferences?.filter((reference: any) => reference._ref === userProfile?._id)

      // const existingReview = await getReview(userProfile?._id ?? '', referenceId[0]._ref);
      // const reviewObject = {

      // }
      router.push(`pendingVideoReview/${referenceId[0]._ref}`);
    }

  };

  const getAllReviews = async (videoId: string) => {
    const reviews = await client.fetch(`*[reviewedVideo._ref == '${videoId}']`);
    console.log('REVIEWS: ', reviews);

    return reviews as IStaffVideoReview[];
  };

  const getReview = async (videoId: string) => {
    const review = await client.fetch(`*[reviewedVideo._ref == '${videoId}' && reviewedBy._ref == '${userProfile?._id}'][0]`)

    return review as IStaffVideoReview;
  };

  const fetchData = async () => {
    if (videos && videos.length > 0) {
      const videoDataPromises = videos.map(async (video: IVideo) => {
      
          
          const hasReviewerReviewed = video.isVideoReliable?.staffReviewReferences?.some(reference => reference._ref === userProfile?._id) ?? false;
          console.log('hasReviewerReviewed:', hasReviewerReviewed)

          const allReviews = await getAllReviews(video._id)
          const review = await getReview(video._id)
          console.log('allReviews:', allReviews)
          console.log('review:', review)

          const isPending = hasReviewerReviewed ? review.isPending : undefined
          console.log('isPending:', isPending)

          const nonPendingStaffReviews = allReviews?.filter(
            (reference) => reference.isPending === false
          );
          console.log('nonPendingStaffReviews:', nonPendingStaffReviews)

          const remainingReviews = 10 - (nonPendingStaffReviews?.length ?? 0);
          console.log('remainingReviews:', remainingReviews)

        return {
          ...video,
          videoId: video._id,
          //timeAgo,
          hasReviewerReviewed,
          isPending,
          nonPendingStaffReviews,
          remainingReviews,
        };
      });

      const resolvedVideoData = await Promise.all(videoDataPromises);
      console.log('resolvedVideoData:', resolvedVideoData);
      setVideoData(resolvedVideoData);
    } else {
      
    }
  };

  useEffect(() => {
    

    fetchData();
  }, [videos]);

  return (
    <div style={{backgroundColor: 'black'}}>
      {showNavBar ? (
        <NavBar />
      ) : (
        <div style={{height: 19, width: '100vw'}}>
        </div>
      )}
      <div style={{color: 'white', fontSize: 30}}>
        Videos waiting for review
      </div>
      {videoData.map((video: IVideo, index: number) => {
          const now = new Date();
          const createdAt = new Date(video.createdAt);
          const timeDifference = Math.floor((now.getTime() - createdAt.getTime()) / 1000); // Calculate time difference in seconds
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
          
          // const hasReviewerReviewed = video.isVideoReliable?.staffReviewReferences?.some(reference => reference._ref === userProfile?._id) ?? false;
          // console.log('hasReviewerReviewed:', hasReviewerReviewed)

          // const allReviews = await getAllReviews(video._id)
          // const review = await getReview(video._id)
          // // console.log('referenceIndex:', referenceIndex)

          // const isPending = hasReviewerReviewed ? review.isPending : undefined
          // console.log('isPending:', isPending)

          // const nonPendingStaffReviews = allReviews?.filter(
          //   (reference) => reference.isPending === false
          // );
          // console.log('nonPendingStaffReviews:', nonPendingStaffReviews)

          // const remainingReviews = Math.max(10 - (nonPendingStaffReviews?.length || 0), 0);
          
          return (
            <div key={video._id} style={{display: 'flex', flexDirection: 'row'}}>
              <div style={{display: 'flex', flexDirection: 'column', height: 300}}>
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
                    onLoadedMetadata={() => handleVideoLoadedMetadata(index)}
                  />
                </button>
                <div style={{color: 'white', alignSelf: 'center', fontSize: 25}}>
                {videoDurations[index]}
                </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column'}}>
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
                <div style={{fontSize: 17, width: 400, height: 100, overflow: 'auto'}}>
                  {video.cues?.map((item, idx) => {
                    const matchedWord = highlightedTranscription.includes(item.alternatives[0].content);
  
                    const isCurrentWord = idx === currentWordIndex && index === videoRefs.current.indexOf(currentVideo);
                    return (
                      <span
                        key={idx}
                        onClick={() => playWord(item.start_time, index)}
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
                  {video.claims?.length} Claims
                  <div style={{color: 'white', fontSize: 20, width: 400, height: 100, overflow: 'auto'}}>
                  {video?.claims.map((claim, idx) => (
                    <div style={{paddingBottom: 15}} key={idx}>
                      {claim.claim}
                    </div>
                  ))}
                  </div>
                </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', width: 100, height: 200}}>
                <div style={{}}>
                  <button
                    onClick={async() => handlePush(videoData[index].isPending, video)}
                    style={{
                      width: 100,
                      height: 50,
                      fontSize: 20,
                      backgroundColor: videoData[index].isPending !== undefined ? (videoData[index].isPending ? 'yellow' : 'rgb(0, 183, 255)') : 'white'
                    }}
                    className='hover:bg-blue'
                    //disabled={!isPending}
                  >
                    {videoData[index].isPending !== undefined ? 
                    (videoData[index].isPending ? 'Continue': 'Done') : 'Review'}
                  </button>
                </div>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <div style={{}}>
                    <p style={{fontSize: 20, color: 'white', textAlign: 'center'}}>
                    {videoData[index].remainingReviews} more reviews left
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
        })
      }
    </div>
  );
}

export default ReviewVideos;

export async function getServerSideProps() {
  const pendingVideos = await client.fetch(`*[_type == 'video' && isVideoReliable.proof.flag == 'existing' && isAboutGod && areClaimsReviewed]{
    videoUrl,
    isVideoReliable {
      staffReviewReferences
    },
    cues,
    claims,
    allClaims,
    _id,
    createdAt,
  } | order(createdAt asc)`);

  // const userRefs = pendingVideos.map((video: any) => video.postedBy._ref);
  
  // const userPromises = userRefs.map((userRef: string) =>
  //   client.fetch(`*[_id == '${userRef}']`)
  // );

  // const users = await Promise.all(userPromises);

  //console.log("pendingVideos:", JSON.stringify(pendingVideos, null, 2));
  //console.log("users:", users);

  const props = {
    videos: pendingVideos || [],
    //users: users || []
  };

  return {
    props,
  };
};


