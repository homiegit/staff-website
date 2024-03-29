import { client } from '../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from "axios";
import { SERVER_IP_URL } from '../../homie-website/config';
import { GiCancel } from 'react-icons/gi';
import { AiFillPlusSquare } from 'react-icons/ai'
import { IStaff, IVideo } from '../../homie-website/types';
import { flatten } from 'lodash';
import NavBar from '../components/NavBar';

interface Data {
  staffUsers: IStaff[];
  videoReviewsThisWeek: {
    _ref: string;
  }[];
  claimReviewsThisWeek: {
    _ref: string;
  }[];
}

const EditStaffUser = ({staffUsers, videoReviewsThisWeek, claimReviewsThisWeek}: Data) => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [selectedUser, setSelectedUser] = useState<IStaff>();
  const [data, setData] = useState<Data[]>([]);

  const temporaryPassword = `${userName}.temporary.password`

  const [showNavBar, setShowNavBar] = useState(false);
  const oneWeekAgo = 

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000)
    
  }, [])

  useEffect(() => {
    console.log(`staffUsers: `, staffUsers)
  }, [staffUsers]);
  useEffect(() => {
    console.log(`videoReviewsThisWeek: `, videoReviewsThisWeek)
  }, [videoReviewsThisWeek]);
  useEffect(() => {
    console.log(`claimReviewsThisWeek: `, claimReviewsThisWeek)
  }, [claimReviewsThisWeek]);

  // const fetchData = async() => {
  //   const videoReviewsThisWeek = await client.fetch(`*[_type == 'staffVideoReview' && completedAt >= ${oneWeekAgo}]`);

  //   const videosWithClaimReviews = await client.fetch(`*[allClaims.staffReviewedClaims.length != 0 && claims.length == 0]{
  //     allClaims{
  //       staffReviewedClaims
  //     }
  //   }`);

  //   let videosWithClaimReviewsThisWeek = [];

  //   staffUsers.map((user, index) => {
  //     const completedClaimReviewsThisWeek = videosWithClaimReviews.filter((video: IVideo) => video.allClaims.staffReviewedClaims.some(video => video.reviewedBy._ref === user._id));

  //     videosWithClaimReviewsThisWeek.push(completedClaimReviewsThisWeek);
  //   });

  //   return {
  //     videoReviewsThisWeek
  //   }
  // }

  const handleUserName = (text: string) => {
    setEmail(text);
    setUserName(text);
  }

  const handlePhoneNumber = (text: string) => {
    setPhoneNumber(text);
  }

  const createStaffUser = async() => {
    const newUserObject = {
      userName: userName,
      email: email,
      phoneNumber: phoneNumber,
      temporaryPassword: temporaryPassword
    }

    try {
      const createStaffUserResult = await axios.post(`${SERVER_IP_URL}/api/astra/createStaffUser`, newUserObject);
      console.log('createStaffUserResult', createStaffUserResult);

      if (createStaffUserResult.status === 200) {
        router.reload();
      }

    } catch (error) {
      console.log('Error sending newUserObject to server', error)
    }
  }

  const editStaffJobTitles = async() => {

    if (selectedUser) {
      try {
        await client.patch(selectedUser._id).set({jobTitles: jobTitles}).commit()
        console.log(`successfully updated ${selectedUser.userName} jobTitles to ${jobTitles}`)
        router.reload()

      } catch (error) {
        console.log('error patching user', error)
      }
    } else {
      console.log('no user selected')
    }
  }

  const handleJobTitle = async(text: string, idx: number) => {
    setJobTitles((prevTitles) => {
      const updatedTitles = [...prevTitles];
      updatedTitles[idx] = text;
      return updatedTitles;
    });
  };

  const handleAddJobTitle = () => {
    setJobTitles((prevTitles) => [...prevTitles, '' ]);
  }

  const handleDeleteJobTitle = (idx: number) => {
    setJobTitles((prevTitles) => {
      const updatedTitles = prevTitles.filter((title, index) => index !== idx);
      return updatedTitles;
    });
  };

  useEffect(() => {
    console.log('jobTitles:', jobTitles);
  }, [jobTitles]);

  useEffect(() => {
    console.log('selectedUser:', selectedUser);
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
    setJobTitles(selectedUser.jobTitles.map((title) => title));
    } else {
      setJobTitles([]);
    }
  }, [selectedUser])

  const inputs = jobTitles.map((title, i) => (
    <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <input value={title} onChange={(e) => handleJobTitle(e.target.value, i)} placeholder='Job Title'/> 
      <button style={{ color: 'transparent', backgroundColor: 'transparent'}}>
        <GiCancel onClick={() => handleDeleteJobTitle(i)} style={{ color: 'red' }} />
      </button>
    </div>
  ));  

  const selectedUserVideoReviewsCount = videoReviewsThisWeek?.filter((user) => user._ref !== selectedUser?.userName);
  const selectedUserClaimReviewsCount = claimReviewsThisWeek?.filter((user) => user._ref !== selectedUser?.userName);

  return(
    <div style={{width: '100vw', height: '100vh', backgroundColor: 'black', display: 'flex', flexDirection: 'column'}}>
      <>
      {showNavBar ? (
        <NavBar />
      ) : (
        <div style={{height: 19, width: '100vw'}}>

        </div>
      )}
      <div style={{display: 'flex', flexDirection: 'column'}}>

        <div style={{display: 'flex', flexDirection: 'row'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200, height: 200}}>
            <div style={{color: 'white', fontSize: 20, alignSelf: 'center'}}>
              New Staff User
            </div>
              <input onChange={(e) => handleUserName(e.target.value)} placeholder='Email'>
              </input>
              <input onChange={(e) => handlePhoneNumber(e.target.value)} placeholder='Phone Number'>
              </input>
            <button onClick={() => createStaffUser()} disabled={userName === '' || phoneNumber === ''}>
              Create
            </button>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200, height: 200}}>
            <div style={{color: 'white', fontSize: 20, alignSelf: 'center'}}>
              Edit Job Titles
            </div>
              {/* <input onChange={(e) => handleUserName(e.target.value)} placeholder='User Name'>
              </input> */}
              {inputs}
                <AiFillPlusSquare style={{color: 'cornflowerblue', fontSize: 20}} onClick={() => handleAddJobTitle()}/>
            <button onClick={() => editStaffJobTitles()} disabled={jobTitles.length === 0 || jobTitles.every(title => selectedUser?.jobTitles.includes(title)) || jobTitles.some((title) => title === "")}>
              Edit
            </button>
          </div>
        <div style={{display: 'flex', flexDirection: 'column', backgroundColor: 'mediumorchid', width: '25vw', height: '100vh', position: 'absolute', right: 0, overflow: 'auto'}}>
          {staffUsers?.map((user, idx) => (
            <div key={user._id}>
            <button onClick={() =>  selectedUser === user ? setSelectedUser(undefined) : setSelectedUser(user)}>
              <div style={{fontSize: 30, color: 'mediumaquamarine'}}>
                {user.userName}
              </div>
              <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}} >
                {user.jobTitles.map((title, i) => (
                  <div key={`${title}::${i}`}>
                    {user.jobTitles.length > 1 ? (
                      <div style={{paddingRight: 10}}>
                        {title}{i === user.jobTitles.length - 1 ? "": " | "}
                      </div>
                    ) : (
                      <div>
                        {title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </button>
            </div>
          ))}
        </div>
        </div>
        {selectedUser !== undefined && (
          <div style={{width: '75vw', height: '50vh', backgroundColor: 'lawngreen'}}>
            <div style={{display: 'flex', flexDirection: 'row'}}>
              <Link href={`/profile/${selectedUser._id}`}>
                <div style={{fontSize: 30, color: 'black', paddingRight: 10}}>
                  {selectedUser.userName}
                </div>
              </Link>
                {selectedUser.jobTitles.map((title, i) => (
                  <>
                    {selectedUser.jobTitles.length > 1 ? (
                      <div style={{fontSize: 15, color: 'black', paddingRight: 10, alignSelf: 'center'}} key={`${title}-${i}`}>
                        {title}{i === selectedUser.jobTitles.length - 1 ? "": " | "}
                      </div>
                    ) : (
                      <div key={`${title}:${i}`}>
                        {title}
                      </div>
                    )}
                  </>
                ))}      
            </div>
            {selectedUser.jobTitles.includes('videoReviewer') && 
              <div style={{fontSize: 20, color: 'black'}}>
              {selectedUserVideoReviewsCount.length ?? 0} video reviews this week
              </div> 
            }
            {selectedUser.jobTitles.includes('claimReviewer') && 
              <div style={{fontSize: 20, color: 'black'}}>
                {selectedUserClaimReviewsCount.length ?? 0 } claim reviews this week
              </div>
            } 
            
          </div>
        )}
      </div>
      </>
      
    </div>
      
  )
};

export default EditStaffUser;

export async function getServerSideProps() {
  const allStaffUsers = await client.fetch(`*[_type == 'staff']`);
  console.log('allStaffUsers:', allStaffUsers)
  
  const videosReviewedByStaff = await client.fetch(`*[_type == 'video' && isVideoReliable.staffReviewReferences.staffReviewReference.length != 0]{
    isVideoReliable{
      staffReviewReferences
    }
  }`);

  const videoClaimsReviewedByStaff = await client.fetch(`*[_type == 'video' && allClaims.staffReviewedClaims.length != 0]{
    allClaims{
      staffReviewedClaims
    }
  }`);

  // Calculate one week ago from the current date
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  let videoReviewers: any = [];
  let claimReviewers: any = [];

  videosReviewedByStaff?.forEach((video: IVideo) => {
    const videoReviewsWithinOneWeek = video.isVideoReliable?.staffReviewReferences.isPendingArray.filter((review: any) => {
      const reviewDate = new Date(review._createdAt);
      return reviewDate >= oneWeekAgo; // Check if the review date is on or after one week ago
    });

    videoReviewers = videoReviewers?.concat(videoReviewsWithinOneWeek ?? []);
  });

  videoClaimsReviewedByStaff?.forEach((video: IVideo) => {
    const claimReviewsWithinOneWeek = video.allClaims?.staffReviewedClaims.filter((review: any) => {
      const reviewDate = new Date(review.completedAt);
      return reviewDate >= oneWeekAgo; // Check if the review date is on or after one week ago
    });

    claimReviewers = claimReviewers?.concat(claimReviewsWithinOneWeek ?? []);
  });

  const videoReviewsThisWeek = videoReviewers?.map((review: any) => review?.reviewedBy);
  const claimReviewsThisWeek = claimReviewers?.map((review: any) => review?.reviewedBy);

  const props = {
    staffUsers: allStaffUsers || [],
    videoReviewsThisWeek: videoReviewsThisWeek || [],
    claimReviewsThisWeek: claimReviewsThisWeek || []
  };

  return {
    props,
  };
}
