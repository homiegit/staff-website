import { client } from '../../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';


import { IVideo, IStaff, IStaffVideoReview } from '../../../homie-website/types.js'
import useAuthStore from '../../store/authStore';
import { StaffVideoReviewVideoCard } from '../../components/StaffVideoReviewVideoCard';
import NavBar from '../../components/NavBar';

const Profile = () => {
  const { userProfile, addUser, removeUser } = useAuthStore();
  const [allReviews, setAllReviews] = useState<IStaffVideoReview[]>([]);
  const [areAllReviewsFetched, setAreAllReviewsFetched] = useState(false)
  const [didReachBottom, setDidReachBottom] = useState(false)

  const router = useRouter();

  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000)
  }, [])

  useEffect(() => {
    if (!areAllReviewsFetched) {
      fetchCompletedReviews()
    }
  }, []);

  const fetchCompletedReviews = async() => {
    if (userProfile) {
      const reviews = await client.fetch(`*[reviewedBy._id == '${userProfile._id}'][0..9] | order(_createdAt desc)`);

      setAllReviews(reviews);
      setAreAllReviewsFetched(true);
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
      <div style={{display: 'flex', flexDirection: 'column', backgroundColor: 'beige'}}>
      {userProfile && (
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{color: 'cadetblue', fontSize: 40, alignSelf: 'center'}}>
            {userProfile.userName}
          </div>
          <div>
            {userProfile.jobTitles.map((title, index) => 
              <div key={index} style={{color: 'darkmagenta', fontSize:20}}>
              </div>
            )}
          </div>
        </div>
      )}
      {allReviews && (
        allReviews.map((review, index) => 
          <div key={index}>
            <StaffVideoReviewVideoCard reviewObject={review}/>
          </div>
        )
      )}
      </div>
    </>
  )
};

export default Profile;