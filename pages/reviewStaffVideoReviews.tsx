import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4} from 'uuid'
import { useRouter } from 'next/router';
import { client } from '../../homie-website/utils/client'

import { IStaff, IStaffVideoReview } from '../../homie-website/types.js'
import VideoCard from '../components/VideoCard';

import { GiCancel } from 'react-icons/gi'
import { GrAddCircle } from 'react-icons/gr'
import { FaCheck } from 'react-icons/fa'
import { HiExclamationCircle } from 'react-icons/hi'
import { StaffVideoReviewVideoCard } from '../components/StaffVideoReviewVideoCard';
import { forEach } from 'lodash';
import NavBar from '../components/NavBar';

interface IProps {
  staffVideoReviews: IStaffVideoReview[];
};

const reviewStaffVideoReviews = ({staffVideoReviews}: IProps) => {
  const router = useRouter();
  console.log("staffVideoReviews:", staffVideoReviews);

  const [allStaff, setAllStaff] = useState<IStaff[]>([]);
  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000)
  }, [staffVideoReviews])


  useEffect(() => {
    if (allStaff?.length === 0) {
      fetchAllStaff()
    }
  }, []);

  // useEffect(() => {
  //   addReviewedBy()
  // }, [])

  // const addReviewedBy = async() => {
  //   await client.patch('48149409-564a-4603-b5e3-d9952c16057e').set({reviewedBy: {_ref: 'df299644-da99-45b8-95df-2c12de199fc1'}}).commit()
  // }

  const fetchAllStaff = async () => {
    try {
      const staffIds = staffVideoReviews.map((review) => review.reviewedBy?._ref);
  
      // Use Promise.all to fetch data for all staff members concurrently
      const staffDataPromises = staffIds.map((staffId) => client.fetch(`*[_id == '${staffId}']`));
      const staffDataArray = await Promise.all(staffDataPromises);
  
      setAllStaff(staffDataArray);
    } catch (error) {
      console.error(error);
    }
  };
  

  return(
    <>
      {showNavBar ? (
        <NavBar />
      ) : (
        <div style={{height: 19, width: '100vw'}}>

        </div>
      )}
      {staffVideoReviews?.length != 0 && (
        staffVideoReviews?.map((review, index) => 
          <div key={index}>
            <div onClick={() => {
              const reviewObject = {
                reviewId: review._id,
                staffVideoUrl: review.staffVideoUrl ?? ''
              }
              const reviewParam = encodeURIComponent(JSON.stringify(reviewObject));

              router.push(`/staffVideoReviews/${reviewParam}`)
            }} style={{color: 'black'}} >
              {allStaff[index]?.userName}
            </div>
            <StaffVideoReviewVideoCard reviewObject={staffVideoReviews[index]} />
          </div>
        )
      )}
    </>
  )
};

export default reviewStaffVideoReviews;

export async function getServerSideProps() {
  const completedReviews = await client.fetch(`*[_type == 'staffVideoReview' && isPending == false]`)
  console.log('completedReviews:', completedReviews)

  const props = {
    staffVideoReviews: completedReviews || []
  };

  return {
    props
  }
}
