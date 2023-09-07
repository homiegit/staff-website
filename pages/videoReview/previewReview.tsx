import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import { client } from '../../../homie-website/utils/client'

import { IVideo, IUser } from '../../../homie-website/types.js'

import { GiCancel } from 'react-icons/gi'
import { FaCheck } from 'react-icons/fa'
import { HiExclamationCircle } from 'react-icons/hi'
import { ClaimArray } from './[videoId]';

interface StaffReview {
  staffReview: {
    videoId: string;
    reviewedBy: string;
    chosenVideoReliability: string;
    text: string;
    sources: string[];
    claimArray: ClaimArray[];
  }
}
const reviewer = 'diego'

const PreviewReview = (staffReview: StaffReview) => {
  const router = useRouter()

  // const submitReview = async() => {
  //     await client.patch(staffReview.staffReview.videoId).set({isVideoReliable: {
  //       reliability: 'pending', proof: {
  //         text: '',
  //         sources: []
  //       }
  //     }}).commit()

  // }

  const submitReview = async() => {

    console.log('staffReview:', staffReview);

    const video = await client.fetch(`*[_id == '${staffReview.staffReview.videoId}'][0]{
      isVideoReliable {
        staffReviews[]
      }
    }`)
    console.log("video:", video);

    const claimsReliability = staffReview.staffReview.claimArray.map((claim) => claim.reliability);


    const newStaffReview = {
      reviewedBy: staffReview.staffReview.reviewedBy,
      text: staffReview.staffReview.text ?? '',
      sources: staffReview.staffReview.sources ?? [],
      claimsReliability: claimsReliability,
      isPending: 'false',
      _key: uuidv4()

    } 

    let newStaffReviews = [newStaffReview]
    if (
      video?.isVideoReliable?.staffReviews?.length !== 0 &&
      video?.isVideoReliable?.staffReviews !== null
      ) {
        // Filter out reviews by the same reviewer
        const previousStaffReviews = video?.isVideoReliabile?.staffReviews?.filter((review: any) => review.reviewedBy === reviewer);
        console.log("previousStaffReviews:", previousStaffReviews);

        if (previousStaffReviews?.length !== 0) {
          newStaffReviews = [...previousStaffReviews, newStaffReview];
        }
    }
    
    console.log("newReviews:", newStaffReviews);

    if (video) {
      const newIsVideoReliable = {
        reliability: video.isVideoReliable?.reliability,
        proof: {
          text: video.isVideoReliable?.proof?.text,
          sources: video.isVideoReliable?.proof?.sources
        },
        staffReviews: newStaffReviews
      }

      await client.patch(staffReview.staffReview.videoId).set({isVideoReliable: newIsVideoReliable}).commit()

      router.push(`/videoReview/allStaffReviews/${video._id}`)
    }
  };

  return(
    <div>
      <div>
        {staffReview.staffReview.chosenVideoReliability}
      </div>
      <div dangerouslySetInnerHTML={{ __html: staffReview.staffReview.text }}>
      </div>
      <div>
        {staffReview.staffReview.sources}
      </div>
      <div>
        {staffReview.staffReview.claimArray.map((claim) => 
          <>
            <div>
              {claim.claim}
            </div>
            <div>
              {claim.reliability}
            </div>
          </>
        )}
      </div>
      <button onClick={() => submitReview()}>
          Submit
      </button>
    </div>
  )
}

export default PreviewReview;