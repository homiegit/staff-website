import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4} from 'uuid'
import { useRouter } from 'next/router';
import { client } from '../../../homie-website/utils/client'

import { IVideo, IStaff, IStaffVideoReview } from '../../../homie-website/types.js'

import { GiCancel } from 'react-icons/gi'
import { GrAddCircle } from 'react-icons/gr'
import { FaCheck, FaUserPlus } from 'react-icons/fa'
import { HiExclamationCircle } from 'react-icons/hi'
import { StaffVideoReviewVideoCard } from '../../components/StaffVideoReviewVideoCard';
import NavBar from '../../components/NavBar';

const StaffVideoReview = () => {
  const router = useRouter()
  console.log("router.query:", router.query);

  const reviewId = router.query.id
  const decodedReview = decodeURIComponent(reviewId as string ?? '');
  console.log("reviewId:", reviewId);
  console.log("decodedReview:", decodedReview);

  const parsedQuery = JSON.parse(decodedReview?.replace(/^id=/, '')); // Remove 'video=' prefix
  console.log("parsedQuery:", parsedQuery);

  const staffVideoUrl = parsedQuery.staffVideoUrl;
  const reviewid = parsedQuery.reviewId;

  console.log('staffVideoUrl:', staffVideoUrl);
  console.log('reviewid:', reviewid);

  const [isReviewFetched, setIsReviewFetched] = useState(false);
  const [reviewObject, setReviewObject] = useState<IStaffVideoReview | null>(null)
  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000)
  }, [])


  const fetchReview = async() => {
    const review = await client.fetch(`*[_id == '${reviewid}']`);

    setReviewObject(review[0]);
    setIsReviewFetched(true);

    return review[0]
  }

  useEffect(() => {
    if (!isReviewFetched) {
      fetchReview()
    }
  }, []);

  return(
    <>
      {showNavBar ? (
        <NavBar />
      ) : (
        <div style={{height: 19, width: '100vw'}}>

        </div>
      )}
      {reviewObject && (
        <StaffVideoReviewVideoCard reviewObject={reviewObject}/>
      )}
    </>
  )
};


export default StaffVideoReview

