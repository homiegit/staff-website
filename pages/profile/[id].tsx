import { client } from '../../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';


import { IVideo, IStaff, IStaffVideoReview, IUser } from '../../../homie-website/types.js'
import useAuthStore from '../../store/authStore';
import { StaffVideoReviewVideoCard, formatDateToMMDDYYYY } from '../../components/StaffVideoReviewVideoCard';
import NavBar from '../../components/NavBar';

const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

console.log('dateNow:', Date.now().toString());

const Profile = () => {
  const { userProfile, addUser, removeUser } = useAuthStore();
  const [user, setUser] = useState<IUser | IStaff>();

  const [allReviews, setAllReviews] = useState<IStaffVideoReview[]>([]);
  const [allCompletedReviews, setAllCompletedReviews] = useState<IStaffVideoReview[]>([]);
  const [allCompletedReviewsThisWeek, setAllCompletedReviewsThisWeek] = useState<IStaffVideoReview[]>([]);

  const [areAllReviewsFetched, setAreAllReviewsFetched] = useState(false)
  const [didReachBottom, setDidReachBottom] = useState(false)

  const router = useRouter();
  const ref = router.query.id;
  //console.log(router)

  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000);

    // if (!user) {
      fetchUser()
    // };

    // if (!areAllReviewsFetched) {
      fetchCompletedReviews()
    // };

  }, [])

  useEffect(() => {

  }, []);

  const fetchUser = async() => {
    const usr = await client.fetch(`*[_id == '${ref}'][0]`);
    setUser(usr);

  }

  const fetchCompletedReviews = async() => {
    if (userProfile) {
      const reviews = await client.fetch(`*[reviewedBy._ref == '${userProfile._id}'][0..9] | order(_createdAt desc)`);
      console.log('reviews:', reviews);

      const completedReviews = reviews.filter((review: IStaffVideoReview) => review.isPending === false);
      console.log('completedReviews:', completedReviews);


      const completedReviewsThisWeek = completedReviews.filter((review: IStaffVideoReview) => {
        const reviewDate = new Date(review.completedAt);

        return reviewDate >= oneWeekAgo;
      }
      );
      
      console.log('completedReviews:', completedReviews);

      setAllReviews(reviews);
      setAllCompletedReviews(completedReviews);
      setAllCompletedReviewsThisWeek(completedReviewsThisWeek);
      setAreAllReviewsFetched(true);
    }
  };

  
  function isStaff(user: IStaff | IUser): boolean {
    return (user instanceof Object && 'jobTitles' in user) ? true : false;
  }
  
  
  return(
    <>
      {showNavBar ? (
        <NavBar />
      ) : (
        <div style={{height: 19, width: '100vw'}}>

        </div>
      )}
      <div style={{display: 'flex', flexDirection: 'column', backgroundColor: 'beige'}}>
      {user && (
        // Check the type of user and render content accordingly
        <>
          {isStaff(user) ? (
            <>  
            <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'center' }}>
              <div style={{ color: 'cadetblue', fontSize: 40, alignSelf: 'center', paddingRight: 20 }}>
                {user.userName}
              </div>
              <div>
               Joined {formatDateToMMDDYYYY(user._createdAt)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'row' }}>
              {(user as IStaff).jobTitles.map((title, index) => (
                <div key={index} style={{ color: 'darkmagenta', fontSize: 15 }}>
                  {title}, {" "}
                </div>
              ))}
              </div>
            </div>
            {allCompletedReviews && (
              allCompletedReviews.map((review, index) => (
                <div key={index}>
                  <StaffVideoReviewVideoCard reviewObject={review} />
                </div>
              ))
            )}
            </>
          ) : (
            // Render content for IUser
            <div>
              <div style={{ color: 'black', fontSize: 40, textAlign: 'center' }}>
                {user.userName}
              </div>
              <div>
               Joined {formatDateToMMDDYYYY(user._createdAt)}
              </div>
              <div>
                {(user as IUser).isUserReliable.reliability ?? ""}
                {(user as IUser).isUserReliable.proof.text ?? ""}
                
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </>
  )
};

export default Profile;
