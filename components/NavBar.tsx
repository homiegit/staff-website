import { client } from '../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import axios from "axios";
import { SERVER_IP_URL } from '../../homie-website/config';
import useAuthStore from '../store/authStore';

const NavBar = () => {
  const router = useRouter();
  const { userProfile, addUser, removeUser } = useAuthStore();

  useEffect(() => {
    console.log('userProfile in NavBar:', userProfile);
  }, [userProfile]);

  return(
    <div style={{display: 'flex', flexDirection: 'row', borderColor: 'red', borderWidth: 10}}>
      {userProfile && (
        <button onClick={() => {removeUser() ; router.push('/')}} style={{border: 2, borderColor: 'white', alignSelf: 'flex-start'}}>
          Sign Out
        </button>
      )}
      {userProfile?.jobTitles?.includes('claimReviewer') && (
        <button onClick={() => router.push('/reviewClaims')} style={{border: 2, borderColor: 'white', color: 'black'}}>
          Review Claims
        </button>
      )}
      {userProfile?.jobTitles?.includes('videoReviewer') && (
        <button onClick={() => router.push('/reviewVideos')} style={{border: 2, borderColor: 'white', color: 'black'}}>
          Review Videos 
        </button>
      )}
      {userProfile?.jobTitles?.includes('owner' || 'administrator') && (
        <button onClick={() => router.push('/editStaffUser')} style={{border: 2, borderColor: 'white', color: 'black'}}>
          Edit Staff User
        </button>
      )}
    </div>
  )
      
};

export default NavBar;