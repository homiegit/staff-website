import { client } from '../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';


import { IVideo, IUser, IStaffVideoReview } from '../../homie-website/types.js'
import VideoCard from '../components/VideoCard';
import useAuthStore from '../store/authStore';
import NavBar from '../components/NavBar';

const PublishVideoReviews = () => {
  const { userProfile, addUser, removeUser } = useAuthStore();

  const router = useRouter();

  const [showNavBar, setShowNavBar] = useState(false);

  const handlePush = (videoId: string) => {

    router.push(`/reviewedVideos/${videoId}`)

  }

  return(
    <>
    </>
  )
};

export default PublishVideoReviews;
