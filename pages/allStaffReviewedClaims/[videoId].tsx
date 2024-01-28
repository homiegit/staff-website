import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4} from 'uuid'
import { useRouter } from 'next/router';
import { client } from '../../../homie-website/utils/client'

import { IVideo, IUser } from '../../../homie-website/types.js'
import VideoCard from '../../components/VideoCard';
import NavBar from '../../components/NavBar';

import { GiCancel } from 'react-icons/gi'
import { GrAddCircle } from 'react-icons/gr'
import { FaCheck } from 'react-icons/fa'
import { HiExclamationCircle } from 'react-icons/hi'

interface Claims {
  chatGptClaims: string[];
  finalClaims: any;
  staffReviewedClaims: any;
}

interface IProps {
  data: {
    video: IVideo;
    user: IUser;
  }
}

interface SuggestEdit {
  reviewedBy: {
    _ref: string;
  };
  claims: {
    claimIndex: number;
    text: string;
    show: boolean;
  }[];
}

const VideoIdAllStaffReviewedClaims = ({data}: IProps) => {
  console.log("data.video::", data.video)
  const router = useRouter();
  const videoId = router.query;

  const [showSuggestEdit, setShowSuggestEdit] = useState<SuggestEdit[]>([]);
  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000)
  }, [])

  useEffect(() => {
    const array = data.video.allClaims?.staffReviewedClaims?.flatMap((review, reviewIndex) => {
      return review.claims.map((claim, idx) => ({
        key: `${reviewIndex}-${idx}`, // Assign a unique key
        reviewedBy: {
          _ref: review.reviewedBy?._ref
        },
        claims: [{
          claimIndex: idx,
          text: '',
          show: false
        }]
      }));
    });
  
    setShowSuggestEdit(array);
  }, [data.video.allClaims?.staffReviewedClaims]);
  

  useEffect(() => {
    console.log('showSuggestEdit:', showSuggestEdit)
  }, [showSuggestEdit])
  
  const setShowForItem = (reviewIndex: number, claimIndex: number, show: boolean) => {
    const updatedArray = [...showSuggestEdit];
    console.log("updatedArray:", updatedArray)

    if (updatedArray[reviewIndex] !== undefined) {
      updatedArray[reviewIndex].claims[claimIndex].show = show
      setShowSuggestEdit(updatedArray);
    }
  };

  const handleSuggestionText = (text: string, index: number, claimIndex: number) => {
    const updatedArray = [...showSuggestEdit];
    updatedArray[index].claims[claimIndex] = { ...updatedArray[index].claims[claimIndex], text };
    setShowSuggestEdit(updatedArray)
  }

  const suggestEdit = (reviewIndex: number, claimIndex: number) => {

  }

  return(
    <>
      {showNavBar ? (
        <NavBar />
      ) : (
        <div style={{height: 19, width: '100vw'}}>

        </div>
      )}
        <div style={{backgroundColor: 'black', display: 'flex', flexDirection: 'row'}}>

          <div style={{display: 'flex', flexDirection: 'column', width: '60vw', height: '100vh'}}>
            <VideoCard video={data.video} user={data.user}/>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex', flexDirection: 'row'}}>

                <div style={{color: 'white', fontSize: 30, padding: 0, alignSelf: 'center'}}>
                  Chat Gpt Claims
                  <div style={{ overflow: 'auto'}}>
                    
                    {data.video?.allClaims?.chatGptClaims?.length > 0 && (
                    data.video?.allClaims?.chatGptClaims?.map((claim, index) => (claim.responses && (
                      <>
                      <p>{claim.responses.length}</p>
                      <div key={index} style={{color: 'white', fontSize: 20, padding: 5}}>
                        {claim.claim}
                        {claim.responses[index]?.answer}
                        {claim.responses[index]?.explanation}
                      </div>
                      </>
                      )))
                    )} 
                  </div>
                </div>
                <div style={{color: 'white', fontSize: 30, padding: 0, alignSelf: 'flex-end'}}>
                  {data.video?.allClaims?.chatGptClaims?.length > 0 && (
                    data.video?.allClaims?.chatGptClaims?.map((claim, index) => (claim.responses && (
                        <div key={index} style={{color: 'white', fontSize: 20, padding: 5}}>
                          {claim.responses[index]?.sources}
                        </div>
                      )))
                    )}
                </div>
              </div>
              <div style={{color: 'white', fontSize: 30, alignSelf: 'center'}}>
                Staff Reviewed Claims
                <div style={{ overflow: 'auto', height: '35vh'}}>
                  {data.video?.allClaims?.staffReviewedClaims?.length > 0 && (
                    data.video?.allClaims?.staffReviewedClaims?.map((review: any, reviewIndex: number) => 
                      <div key={reviewIndex} style={{backgroundColor: 'deepskyblue', borderColor: 'cornflowerblue', borderWidth: 3, padding: 10}}>
                        {/* <div style={{color: 'black', backgroundColor: 'navajowhite', borderColor: 'deepskyblue', width: `${review.reviewedBy.length}ch`, alignSelf: 'center'}}>
                          {review.reviewedBy}
                        </div> */}
                        <div>{review.claims.length} Claims</div>

                          {review.claims.map((claim: string, claimIndex: number) => 
                              <div key={claimIndex} style={{color: 'white', fontSize: 20, padding: 5}}>
                                {claim}
                              </div>
                          )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
          <div style={{width: '40vw', height: '100vh',  right: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'antiquewhite'}}>
            <div style={{color: 'black', fontSize: 30, alignSelf: 'center'}}>
              Claims
              {data.video.allClaims?.claimsInProgress?.length > 0 && (
                data.video.allClaims?.claimsInProgress?.map((claim: any, i: number) => (
                <div key={i} style={{color: 'black', fontSize: 20}}>
                  {claim}
                  {/* <button onClick={() => setShowForItem(reviewIndex, claimIndex, !showSuggestEdit[reviewIndex]?.claims[claimIndex]?.show)}>
                    Suggest Edit
                  </button>
                  {showSuggestEdit[reviewIndex]?.claims[claimIndex]?.show && (
                    <div>
                      <textarea style={{width: 200, height: 200, color: 'white', backgroundColor: 'black'}} onChange={(e) => handleSuggestionText(e.target.value, reviewIndex, claimIndex)}/>
                      <button onClick={() => suggestEdit(reviewIndex, claimIndex)}>
                        Sumbit
                      </button>
                    </div>
                  )} */}
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      </>
  )
}

export default VideoIdAllStaffReviewedClaims;

export async function getServerSideProps(context: any) {
  // Access the context object here
  const { query } = context;
  const videoId = query.videoId;
  const video = await client.fetch(`*[_id == '${videoId}'][0]{
    _createdAt,
    allClaims,
    postedBy,
    cues,
    videoUrl
  }`);
  console.log('video in allStaffReviewedClaims:', video)

  const user = await client.fetch(`*[_id == ${video.postedBy._id}][0]{
    _id,
    userName
  }`)
  const props = {
    data: {
      video: video || {},
      user: user || {}
    }
    // chatGptClaims: video.claims?.chatGptClaims || [],
    // finalClaims: video.claims?.finalClaims || [],
    // staffReviewedClaims: video.claims?.staffReviewedClaims || []
  }

  return {
    props,
  }
};