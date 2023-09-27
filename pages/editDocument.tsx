import { client } from '../../homie-website/utils/client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import axios from "axios";
import { SERVER_IP_URL } from '../../homie-website/config';
import { GiCancel } from 'react-icons/gi';
import { AiFillPlusSquare } from 'react-icons/ai';
import { IStaff, IVideo, Items } from '../../homie-website/types';
import NavBar from '../components/NavBar';
import useAuthStore from '../store/authStore';


const EditDocument = () => {
  const { userProfile, addUser, removeUser } = useAuthStore();
  const router = useRouter();

  const [showNavBar, setShowNavBar] = useState(false);
  const [videoId, setVideoId] = useState('');

  const [selectedVideo, setSelectedVideo] = useState<IVideo>();
  const [newViews, setNewViews] = useState([]);
  const [newCues, setNewCues] = useState<Items[]>([]);
  const [wasCuesUpdated, setWasCuesUpdated] = useState(false);
  const [wasViewsUpdated, setWasViewsUpdated] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000)
  }, []);

  useEffect(() => {
    console.log("selectedVideo:", selectedVideo)
    setWasCuesUpdated(false);
    setWasViewsUpdated(false);

    if (selectedVideo?.cues) {
      setNewCues([...selectedVideo.cues])
    }

  }, [selectedVideo]);

  const getVideo = async(videoid: string) => {
    const video = await client.fetch(`*[_id == '${videoid}'][0]`);
    console.log("video:", video);

    setSelectedVideo(video)
  }

  const handleVideoId = (value: string) => {
    console.log("value:", value)
    setVideoId(value);
  }

  const updateViews = async() => {
    if (selectedVideo) {
      try {
        await client.patch(selectedVideo?._id).set({views: newViews}).commit();
        setWasViewsUpdated(true);
      } catch {

      }
    } else {

    }
  }

  const emptyViews = async() => {
    if (selectedVideo) {
      try {
        await client.patch(selectedVideo._id).set({views: []}).commit();
        setWasViewsUpdated(true);
      } catch {

      }

    } else {

    }
  }

  const handleItemChange = (index: number, field: keyof Items, value: any) => {
    // Create a copy of newCues
    const updatedCues = [...newCues] as any;
  
    // Create a copy of the alternatives array for the specific item
    const updatedAlternatives = [...(updatedCues[index].alternatives as Items['alternatives'])];
  
    // Update the value of the 'content' property within the alternatives array
    if (field === 'alternatives' && typeof value === 'string') {
      updatedAlternatives[index] = {
        ...(updatedAlternatives[index] as Items['alternatives'][0]), // Copy the original alternative
        content: value, // Update the 'content' property
      };
    } else {
      // For other fields (e.g., 'start_time' and 'end_time'), update the item property
      if (field in updatedCues[index] && typeof value === 'number') {
        updatedCues[index][field] = value
      }
    }
  
    // Update the 'alternatives' property within the copied 'newCues'
    updatedCues[index].alternatives = updatedAlternatives;
  
    // Update the state with the modified cues array
    setNewCues(updatedCues);
  };
  
  const updateCues = async() => {
    if (selectedVideo) {
      setWasCuesUpdated(false);

      try {
        await client.patch(selectedVideo?._id).set({cues: newCues}).commit();
      
        setWasCuesUpdated(true);
      } catch {

      }
    } else {

    }
  }

  const handleNewViews = () => {

  }

  return (
    <div style={{backgroundColor: 'aquamarine', width: '100vw', height: '100vw'}}>
      {showNavBar ? (
        <NavBar /> 
      ) : (
        <div style={{height: 19, width: '100vw'}}>
        </div> 
      )}
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row', alignSelf: 'center', paddingBottom: 20, paddingTop: 20, gap: 10}}>

          <input value={videoId} placeholder='videoId' onChange={(e) => handleVideoId(e.target.value)} style={{color: 'black', fontSize: 15, width: 350, height: 25}}>
          </input>
          <div style={{borderColor: 'white', borderWidth: 10, alignSelf: 'center'}} onClick={() => getVideo(videoId)}>
            Get Video
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            Update Views
            <input value={newViews} placeholder='newViews' onChange={(e) => handleNewViews()} style={{color: 'black', fontSize: 20, width: 100, height: 25}}>
            </input>
            {selectedVideo && (
              <textarea value={JSON.stringify(selectedVideo?.views, null, 2)} disabled style={{color: 'black',fontSize: 15, width: 300, height: 500}}></textarea>
            )}
            <button style={{borderColor: 'white', borderWidth: 1}} onClick={() => updateViews()} disabled={!selectedVideo || newViews === selectedVideo.views}> Update</button>
            <button style={{borderColor: 'white', borderWidth: 1}} onClick={() => emptyViews()} disabled={!selectedVideo}> Empty</button>
            {wasViewsUpdated && (
              <div style={{color: 'green', fontSize: 20}}>
                Successfully updated views
              </div>
            )}

          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            Update Cues
            {/* <input value={newCues} placeholder='newViews' onChange={(e) => handleNewViews()} style={{color: 'black', fontSize: 20, width: 100, height: 25}}>
            </input> */}
            {selectedVideo && 
              <div style={{backgroundColor: 'black'}}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <div style={{ color: 'green', fontSize: 20 }}>
                    Start time
                  </div>
                  <div style={{ color: 'orange', fontSize: 20 }}>
                    Word
                  </div>
                  <div style={{ color: 'red', fontSize: 20 }}>
                    End time
                  </div>
                </div>

                {newCues.map((item, index) => (
                  <div key={index}>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                      {item.alternatives.map((alt, idx) => (
                        <input
                        type="text"
                        value={item.alternatives[idx].content}
                        onChange={(e) => handleItemChange(index, 'alternatives', e.target.value)}
                        style={{alignSelf: 'center', textAlign: 'center'}}
                      />
                      ))}
                      <div style={{display: 'flex', flexDirection: 'row'}}>
                        <input
                          type="text"
                          value={item.start_time}
                          onChange={(e) => handleItemChange(index, 'start_time', e.target.value)}
                          style={{textAlign: 'center'}}
                        />
                        <input
                          type="text"
                          value={item.end_time}
                          onChange={(e) => handleItemChange(index, 'end_time', e.target.value)}
                          style={{textAlign: 'center'}}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }
            <button style={{borderColor: 'white', borderWidth: 1}} onClick={() => updateCues()} disabled={!selectedVideo}> Update</button>
            {wasCuesUpdated && (
              <div style={{color: 'green', fontSize: 20}}>
                Successfully updated cues
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
};

export default EditDocument;