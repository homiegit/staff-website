import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import { client } from '../../../homie-website/utils/client'

import { IVideo, IUser, IStaffVideoReview } from '../../../homie-website/types.js'

import { GiCancel } from 'react-icons/gi'
import { FaCheck } from 'react-icons/fa'
import { HiExclamationCircle } from 'react-icons/hi'
import { ClaimArray } from './[videoId]';
import { create } from 'lodash';

interface IProps {
  staffReview: IStaffVideoReview
}

const PreviewReview = ({staffReview}: IProps) => {
  const router = useRouter()
  const [video, setVideo] = useState<IVideo>()

  // const submitReview = async() => {
  //     await client.patch(staffReview.staffReview.videoId).set({isVideoReliable: {
  //       reliability: 'pending', proof: {
  //         text: '',
  //         sources: []
  //       }
  //     }}).commit()

  // }

  const fetchVideo = async() => {
    const video = await client.fetch(`*[_id == '${staffReview.reviewedVideo._ref}'][0]{
      isVideoReliable {
        staffReviewReferences
      },
      claims
    }`)
    console.log("video:", video);
    setVideo(video)
    return video
  }

  const submitReview = async() => {

    console.log('staffReview:', staffReview);
    const video = await fetchVideo()

    const newStaffReview = {
      _id: staffReview._id,
      reviewedBy: staffReview.reviewedBy,
      reviewedVideo: staffReview.reviewedVideo,
      chosenVideoReliability: staffReview.chosenVideoReliability,
      claimsReliability: staffReview.claimsReliability.map((reliability) => reliability),
      text: staffReview.text ?? '',
      bibleSources: staffReview.bibleSources ?? [],
      urlSources: staffReview.urlSources ?? [],
      isPending: 'false',
    }

    await client.patch(staffReview._id).set(newStaffReview).commit();
  };

  return(
    <div>
      <div>
        {staffReview.chosenVideoReliability}
      </div>
      <div dangerouslySetInnerHTML={{ __html: staffReview.text }}>
      </div>
      {staffReview.bibleSources.map((source, index) => 
        <div key={index}>
          {source.book} {source.chapter} : {source.verse ?? ''}
        </div>
      )}
      {staffReview.urlSources.map((source, index) => 
        <div key={index} onClick={() => window.open(source.url, '_blank')}>
          {source.title}
        </div>
      )}
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div>
          {video?.claims.map((claim) => 
            <>
              <div>
                {claim.claim}
              </div>
            </>
          )}
        </div>
        <div>
          {staffReview.claimsReliability.map((claim) => 
            <>
              <div>
                {claim.reliability}
              </div>
            </>
          )}
        </div>
      </div>
      <button onClick={() => submitReview()}>
          Submit
      </button>
    </div>
  )
}

export default PreviewReview;