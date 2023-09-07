import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4} from 'uuid'
import { useRouter } from 'next/router';
import { client } from '../../../../homie-website/utils/client'

import { IVideo, IUser } from '../../../../homie-website/types.js'
import VideoCard from '../../../components/VideoCard';
import NavBar from '../../../components/NavBar';

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
  reviewedBy: string;
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
    const array = data.video.allClaims.staffReviewedClaims.flatMap((review, reviewIndex) => {
      return review.claims.map((claim, claimIndex) => ({
        reviewedBy: review.reviewedBy,
        claims: [{
          claimIndex: claimIndex,
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
      {showNavBar && (
        <>
          <div style={{position: 'sticky'}}>
          <NavBar />
          </div>
          <div style={{backgroundColor: 'black', display: 'flex', flexDirection: 'row'}}>

            <div style={{display: 'flex', flexDirection: 'column', width: '60vw', height: '100vh'}}>
              <VideoCard video={data.video} user={data.user}/>
              <div style={{display: 'flex', flexDirection: 'column', overflow: 'auto'}}>
                <div style={{color: 'white', fontSize: 30, padding: 0, alignSelf: 'center'}}>
                  Chat Gpt Claims
                  {data.video?.allClaims.chatGptClaims.map((claim) => (
                    <div style={{color: 'white', fontSize: 20, padding: 5}}>
                      {claim}
                    </div>
                  ))}
                </div>
                <div style={{color: 'white', fontSize: 30, alignSelf: 'center'}}>
                  Staff Reviewed Claims
                  {data.video?.allClaims?.staffReviewedClaims.map((review: any, reviewIndex: number) => (
                    <div style={{backgroundColor: 'deepskyblue', borderColor: 'cornflowerblue', borderWidth: 3, padding: 10}}>
                      <div style={{color: 'black', backgroundColor: 'navajowhite', borderColor: 'deepskyblue', width: `${review.reviewedBy.length}ch`, alignSelf: 'center'}}>
                        {review.reviewedBy}
                      </div>
                      <div key={reviewIndex}>
                        {review.claims.map((claim: string, claimIndex: number) => (
                          <>
                            <div key={claimIndex} style={{color: 'white', fontSize: 20, padding: 5}}>
                              {claim}
                            </div>
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
                          </>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{width: '40vw', height: '100vh',  right: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'antiquewhite'}}>
              <div style={{color: 'black', fontSize: 30, alignSelf: 'center'}}>
                Claims
                {data.video.allClaims?.finalClaims?.map((claim: any) => (
                <div style={{color: 'black', fontSize: 20}}>
                  {claim}
                </div>
                ))}
              </div>
            </div>
          </div>
          </>
      )}
      </>
  )
}

export default VideoIdAllStaffReviewedClaims;

export async function getServerSideProps(context: any) {
  // Access the context object here
  const { query } = context;
  const videoId = query.videoId;
  const video = await client.fetch(`*[_id == '${videoId}'][0]{
    allClaims,
    postedBy,
    cues,
    videoUrl
  }`)

  const user = await client.fetch(`[_id == ${video.postedBy._id}]`)
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