import {create} from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { IStaff } from '../../homie-website/types';

const SERVER_IP_URL = process.env.NEXT_PUBLIC_IP_SERVER_URL;

const authStore = (set: any) => ({
  userProfile: null as IStaff | null,
  allUsers: [],

  addUser: (user: IStaff[]) => {
    if (user.length !== 0) {
    set({ userProfile: user });
    }
    
  },

  updateUserImage: async (imageUrl: string, userProfile: any) => {
    let updatedUser
    if (imageUrl) { 
        updatedUser = {
        ...userProfile,
        image: {
          url: imageUrl
        }
      };
    }
    
    const res = await axios.post(`${SERVER_IP_URL}/api/updateStaff`, { updatedUser })
    console.log("res.data:", res.data);

    set((state: any) => {
      if (imageUrl && state.userProfile) {
        const updatedUserProfile = {
          ...state.userProfile,
          image: {
            ...state.userProfile.image,
            url: imageUrl,
          },
        };
        return { userProfile: updatedUserProfile };
      }
      return state;
    });
  },

  removeUser: () => set({ userProfile: null }),

  fetchAllUsers: async () => {
    const response = await axios.get(`${SERVER_IP_URL}/api/staff`);
//console.log("response.data from fetchAllUsers api/users", response.data)

    set({ allUsers: response.data });  
  },

  fetchUser: async (userData: any) => {
    set({userProfile: userData})
  }
});

const useAuthStore = create((
  persist(authStore, {
    name: 'auth',
  })
));

export default useAuthStore;