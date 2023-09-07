import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4} from 'uuid'
import { useRouter } from 'next/router';
import { client } from '../../../homie-website/utils/client'

import { IVideo, IUser } from '../../../homie-website/types.js'
import VideoCard from '../../components/VideoCard';

import { GiCancel } from 'react-icons/gi'
import { GrAddCircle } from 'react-icons/gr'
import { FaCheck } from 'react-icons/fa'
import { HiExclamationCircle } from 'react-icons/hi'

interface IProps {
  video: IVideo
  user: IUser
}

interface Sources {
  title: string
  url: string;
}

interface ClaimsArray {
  index: number;
  claim: string;
}

const reviewer = 'diego'

const VideoId = () => {
  const [video, setVideo] = useState<IVideo | null>(null);
  const [user, setUser] = useState<IUser | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideo = videoRef.current;
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [videoDuration, setVideoDuration] = useState<string | null>('');
  const [newCirclePosition, setNewCirclePosition] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const circleRef = useRef<HTMLDivElement>(null);

  const [chosenVideoReliability, setChosenVideoReliability] = useState('');
  const [text, setText] = useState('');
  const [numberOfClaims, setNumberOfClaims] = useState(1);
  const [claimsArray, setClaimsArray] = useState<ClaimsArray[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  const [showMissingFields, setShowMissingFields] = useState<string[]>([]);
  const [showPreviewReview, setShowPreviewReview] = useState(false);
  const router = useRouter();
  //console.log("router.query:", router.query);

  const {videoId} = router.query
  //console.log("videoId:", videoId);

  const decodedVideoId = decodeURIComponent(videoId as string);
  const parsedQuery = JSON.parse(decodedVideoId.replace(/^video=/, '')); // Remove 'video=' prefix
  //console.log("parsedQuery:", parsedQuery);

  const videoUrl = parsedQuery.videoUrl;
  const videoid = parsedQuery.videoId
  //console.log("videoUrl:", videoUrl);
  //const { videoId: {video: videoUrl} } = router.query;

  const fetchVideo = async() => {
    const pendingVideo = await client.fetch(`*[_id == '${videoid}'][0]{
      videoUrl,
      cues,
      claims,
      _id,
      createdAt,
      postedBy
    }`);

    const pendingVideoUser = await client.fetch(`*[_id == '${pendingVideo.postedBy._ref}'][0]{
      userName,
      isUserReliable,
      _id
    }`)

    setVideo(pendingVideo);
    setUser(pendingVideoUser);
  
    //const userRefs = pendingVideos.map((video: any) => video.postedBy._ref);
    
    // const userPromises = userRefs.map((userRef: string) =>
    //   client.fetch(`*[_id == '${userRef}']`)
    // );
  
    //const users = await Promise.all(userPromises);
  
    console.log("pendingVideo:", pendingVideo);
    console.log("pendingVideoUser:", pendingVideoUser);
  }

  useEffect(() => {
    if (!video) {
      fetchVideo()
    }
  })

 

  useEffect(() => {
    if (claimsArray.length === 0) {
      console.log("empty claimsarray");
      const newClaims = video?.allClaims?.finalClaims?.map((claim, index) => ({
        index: index,
        claim: claim.claim,
      }));
      setClaimsArray(newClaims || []);
    } else {
      console.log("claimsArray:", claimsArray);
    }
  }, [video]);

  const submitClaimsReview = async() => {
    const newStaffClaimsReview = {
      reviewedBy: reviewer,
      claims: claimsArray.map((claim) => claim.claim),
      isPending: false,
      _key: uuidv4()
    }
    console.log("newStaffClaimsReview:", newStaffClaimsReview);

    let newStaffClaimsReviews = [newStaffClaimsReview]
  
    if (video?.allClaims.staffReviewedClaims.length !== 0 && video?.allClaims.staffReviewedClaims !== null && video) {
  
      const previousStaffClaimsReviews = video.allClaims?.staffReviewedClaims?.filter((review: any) => review.reviewedBy !== reviewer);
      console.log("previousStaffClaimsReviews:", previousStaffClaimsReviews);
  
      if (previousStaffClaimsReviews.length !== 0) {
        newStaffClaimsReviews = [
          ...previousStaffClaimsReviews,
          newStaffClaimsReview
        ]
      }
    }

    if (video) {
      const claimsObject = {
        chatGptClaims: video.allClaims?.chatGptClaims,
        finalClaims: video.allClaims?.finalClaims,
        staffReviewedClaims: newStaffClaimsReview
      }

      await client.patch(video._id).set({claims: claimsObject}).commit();
      router.push(`/allStaffReviewedClaims/${videoId}`)
    }
  }

  const handleEditClaim = (index: number, claim: string) => {
    const newClaim = {
      claim: claim,
      index: index
    };

    if (claimsArray.some((claim) => claim.index === index)) {
      setClaimsArray(prevClaims => [...prevClaims.filter((claim) => claim.index !== index), newClaim]);
    } else {
      setClaimsArray(prevClaims => [...prevClaims, newClaim]);
    }
  };

  const handleAddClaim = () => {
    setNumberOfClaims(numberOfClaims + 1);
    const newIndex = numberOfClaims;
    setClaimsArray((prevClaims) => [...prevClaims, { index: newIndex, claim: '' }]);
  };

  const handleDeleteClaim = (indexToDelete: number) => {
    // Use filter to remove the item with the specified index
    const updatedClaimsArray = claimsArray.filter((claim) => claim.index !== indexToDelete);
  
    // Update claimsArray and decrease numberOfClaims
    setClaimsArray(updatedClaimsArray);
    setNumberOfClaims(numberOfClaims - 1);

    // Update the indexes of items in claimsArray after deletion
    const updatedIndexes = updatedClaimsArray.map((claim, index) => ({ ...claim, index }));
    setClaimsArray(updatedIndexes);
    
  };

  useEffect(() => {
    console.log('claimsArray:', claimsArray);
  }, [claimsArray])

  const forms = claimsArray.map((claim, i) => (
    <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <label style={{ fontSize: 20, color: 'white', marginRight: '8px' }}>
        {i + 1}:
      </label>
      <textarea value={claim.claim} onChange={(e) => handleEditClaim(claim.index, e.target.value)} style={{width: 400, height: 30}}/>
      <button style={{ color: 'transparent', backgroundColor: 'transparent'}}>
        <GiCancel onClick={() => handleDeleteClaim(claim.index)} style={{ color: 'red' }} />
      </button>
    </div>
  ));

  return (
    <>
      {!showPreviewReview ? (
        <>
          
          <button
            onClick={() => submitClaimsReview()}
            disabled={claimsArray.some((claim) => claim.claim === '')}
            style={{width: 100, height: 50, backgroundColor: 'white', fontSize: 20, color: 'black', opacity: claimsArray.some((claim) => claim.claim === '') ? 0.5 : 1}}
          >
            Submit
          </button>
          <div style={{display: 'flex', flexDirection: 'row',width: 1000, height: 600}}> 
            <div style={{display: 'flex', flexDirection: 'column',width: 500}}> 
            {video !== null && user !== null && (
              <VideoCard video={video} user={user} />
            )}
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}> 
              <div style={{color: 'white', textAlign: 'center', fontSize: 25, borderColor: 'white', borderWidth: 2, backgroundColor: 'black', width: 600}}>
                ChatGPT Claims 
              </div>
              <div style={{display: 'flex', flexDirection: 'row', backgroundColor: 'black'}} >
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  {forms}
                  <button style={{color: 'white', backgroundColor: 'white', fontSize: 20, width: 175, alignSelf: 'center' }}>
                    <GrAddCircle onClick={() => handleAddClaim()}  />
                  </button>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', overflow: 'auto'}}>
                  {video?.allClaims?.chatGptClaims?.map((claim, i) => 
                    <div style={{color: 'white', fontSize: 15}}>
                      {claim}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
        <GiCancel onClick={() => setShowPreviewReview(false)} style={{fontSize: 30, color: 'red'}}/>

        {/* <PreviewReview staffReview={staffReview}/> */}
        </>
      )}
    </>
  )
};

export default VideoId;
