import { client } from '../../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

import { IVideo, IStaff, IStaffVideoReview, IUser, IReportReview, IReport } from '../../../homie-website/types.js'
import useAuthStore from '../../store/authStore';
import { StaffVideoReviewVideoCard, formatDateToMMDDYYYY } from '../../components/StaffVideoReviewVideoCard';
import NavBar from '../../components/NavBar';
import ReportCard from '../../components/ReportCard';

const ReferenceToReportReview = () => {
  const { userProfile, addUser, removeUser } = useAuthStore();

  const router = useRouter();
  const videoReference = router.query.referenceToReportReview;



  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000);
 
  }, []);

  // const publish = async(videoId: string) => {
  //   const proofObject = {
  //     bibleSources: ,
  //     urlSources: ,
  //     text: ,
  //     flag: 'created'
  //   }

  //   if () {
  //     await client.patch(videoId).set({isVideoReliable: {proof: proofObject}}).commit();

  //   }
  // };



  return(
    <>
      {showNavBar ? (
        <NavBar />
      ) : (
        <div style={{height: 19, width: '100vw'}}/>
      )}

    </>
  );
};

export default ReferenceToReportReview;