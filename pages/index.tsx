import { client } from '../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import axios from "axios";
import { SERVER_IP_URL } from '../../homie-website/config';
import { VscEye, VscEyeClosed} from 'react-icons/vsc'

import { astraClient } from '../../homie-website/astra/client';
import useAuthStore from '../store/authStore';
import { IVideo, IUser, IStaff } from '../../homie-website/types.js'
import NavBar from '../components/NavBar';

const Home = () => {
  const router = useRouter();
  //const userProfile = '';
  const { userProfile, addUser, removeUser } = useAuthStore();
  const [signInUserName, setSignInUserName] = useState('');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInPhoneNumber, setSignInPhoneNumber] = useState('');
  const [showNavBar, setShowNavBar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [wrongUserName, setWrongUserName] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [emptyUserName, setEmptyUserName] = useState(true);
  const [emptyEmail, setEmptyEmail] = useState(true);
  const [emptyPassword, setEmptyPassword] = useState(true);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [noAccountFound, setNoAccountFound] = useState(false);
  const [activeSelection, setActiveSelection] = useState('email');
  const [signInWithEmail, setSignInWithEmail] = useState(true);
  const [signInWithUserName, setSignInWithUserName] = useState(false);

  useEffect(() => {
    console.log('userProfile:', userProfile);
  }, [userProfile]);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000)
  }, [])

  // Fetch the CSRF secret from the server
  const fetchCSRFDataAndStore = async () => {
    try {
      const tokenResponse = await axios.get(`${SERVER_IP_URL}/api/csrfTokenAndSecret`);

      const csrfSecret = tokenResponse.data.csrfSecret;
      const csrfToken = tokenResponse.data.csrfToken;
      console.log("csrfSecret received from server api/csrfTokenAndSecret:", csrfSecret);
      console.log("csrfToken received from server api/csrfTokenAndSecret:", csrfToken);

      // Store CSRF secret and token
      document.cookie = `csrfSecret=${csrfSecret}; Secure; HttpOnly; SameSite=Strict`;
      document.cookie = `csrfToken=${csrfToken}; Secure; HttpOnly; SameSite=Strict`;

      const csrfTokenAndSecret = {
        csrfSecret,
        csrfToken
      }

      return csrfTokenAndSecret;
  
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = async (e: any) => {
    e.preventDefault();
    console.log("searching database before logging in");

    const userData = {
      signInUserName,
      signInEmail,
      signInPhoneNumber,
      signInPassword
    };

    const csrfTokenAndSecret = await fetchCSRFDataAndStore();
    //console.log("csrfTokenAndSecret:", csrfTokenAndSecret);

    try {
      const response = await axios.post(`${SERVER_IP_URL}/api/astra/searchStaffUser`, userData, {
        headers: {
          'X-CSRF-Token': csrfTokenAndSecret?.csrfToken, // Retrieve the anti-CSRF token
          'X-CSRF-Secret': csrfTokenAndSecret?.csrfSecret, // Retrieve the anti-CSRF token
        },
      });
      console.log("user data from astra:", response.data);

      if (response.data.user) {
        console.log("Account found with matching password");
        const { user } = response.data;
        console.log("user:", user)

        const accessTokenResponse = await axios.post(`${SERVER_IP_URL}/api/signin`, { user });
        const token = accessTokenResponse.data.accessToken;
        console.log("Access token:", token)
        // Store new access token along with the CSRF token
        document.cookie = `accessToken=${token}; Secure; HttpOnly; SameSite=Strict`;
        //document.cookie = `csrfToken=${csrfToken}; Secure; HttpOnly; SameSite=Strict`;

        const userObject = await client.fetch(`*[_id == '${user.id}'][0]`);
        console.log("userObject:", userObject)

        addUser(userObject);

        //router.push('/');

      } else if (response.data.wrongPassword) {
        // Email found, but the password is incorrect
        console.error("wrong password");
        setWrongPassword(true)
      } else if (response.data.accountNotFound) {
        // Email not found in the database
        setNoAccountFound(true);
      }
    } catch (error) {
      console.log('Error searching user :', error);
      // Handle any errors that occurred during the API call
      // ...
    }
  }

  const handleUserName = (text: string) => {
    setSignInUserName(text)
  }

  const handleEmail = (text: string) => {
    setSignInEmail(text)
  }

  const handlePassword = (text: string) => {
    setSignInPassword(text)
  }

  return(
    <div style={{backgroundColor: 'aquamarine', width: '100vw', height: '100vw'}}>
      {showNavBar && (
          <>
           <NavBar />
        {userProfile ? (
          <>
          <div style={{color: 'blueviolet', fontSize: 30, textAlign: 'center'}}>
            Welcome Back {userProfile.userName}
          </div>
          </>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 500, height: 500}}>
          <form>
            <input onChange={(e) => handleUserName(e.target.value)} style={{width: 200, height: 30, color: 'black', backgroundColor: 'cornsilk', borderColor: 'steelblue', borderWidth: 2}}>
            </input>
          </form>
          <div style={{display: 'flex', flexDirection: 'row'}}>
            <input onChange={(e) => handlePassword(e.target.value)} style={{width: 200, height: 30, color: 'black', backgroundColor: 'cornsilk', borderColor: 'steelblue', borderWidth: 2}} type={showPassword ? '' : 'password'}>
            
            </input>
            {showPassword ? (
                <VscEye onClick={() => setShowPassword(!showPassword)} style={{color: 'unset', fontSize: 30}}/>
              ) : (
                <VscEyeClosed onClick={() => setShowPassword(!showPassword)} style={{color: 'unset', fontSize: 30}}/>
              )}
          </div>
          <button onClick={(e) => handleLogin(e)}>
            Log In
          </button>
        </div>
        )}
        </>
      )}
    </div>
  )
}

export default Home;

// export async function getServerSideProps() {
//   const { userProfile, addUser, removeUser } = useAuthStore();

//   const props = {
//     user: userProfile
//   }
//   return {
//     props
//   }

// }
