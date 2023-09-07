import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { client } from '../../../homie-website/utils/client'
import Quill from 'quill';
//import dynamic from 'next/dynamic';
import 'quill/dist/quill.snow.css';

import { IVideo, IUser } from '../../../homie-website/types.js'
import VideoCard from '../../components/VideoCard';

import { GiCancel } from 'react-icons/gi'
import { FaCheck } from 'react-icons/fa'
import { HiExclamationCircle } from 'react-icons/hi'
import PreviewReview from './previewReview';

interface IProps {
  video: IVideo
  user: IUser
}

interface Sources {
  title: string
  url: string;
}

export interface ClaimArray {
  index: number;
  claim: string;
  reliability: string;
}

const reviewer = 'diego'

const VideoId = () => {
  const [video, setVideo] = useState<IVideo | null>(null);
  const [user, setUser] = useState<IUser | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideo = videoRef.current;
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [videoDuration, setVideoDuration] = useState<string | null>('');
  const [newCirclePosition, setNewCirclePosition] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const circleRef = useRef<HTMLDivElement>(null);

  const [chosenVideoReliability, setChosenVideoReliability] = useState('');
  const [text, setText] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [source, setSource] = useState('');
  const [showClaimReliability, setShowClaimReliability] = useState<boolean[]>([]);
  const [claimArray, setClaimArray] = useState<ClaimArray[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  const [showMissingFields, setShowMissingFields] = useState<string[]>([]);
  const [showPreviewReview, setShowPreviewReview] = useState(false);
  const router = useRouter();
  //console.log("router.query:", router.query);

  const {videoId} = router.query
  //console.log("videoId:", videoId);

  const decodedVideoId = decodeURIComponent(videoId as string);
  const parsedQuery = JSON.parse(decodedVideoId.replace(/^video=/, '')); // Remove 'video=' prefix
  //console.log("parsedQuery:", parsedQuery);

  const videoUrl = parsedQuery.videoUrl;
  const videoid = parsedQuery.videoId
  //console.log("videoUrl:", videoUrl);
  //const { videoId: {video: videoUrl} } = router.query;

  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    //['blockquote', 'codeblock'],
  
    //[{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    //[{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction
  
    //[{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],
  
    ['clean']                                         // remove formatting button
  ];
  
  var Font = Quill.import('formats/font');

  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!quillRef.current) {
      Quill.register('modules/toolbar', Quill.import('modules/toolbar'));

      quillRef.current = new Quill('#editor-container', {
        modules: {
          toolbar: toolbarOptions,
        },
        placeholder: '',
        theme: 'snow',
      });

      // Add a 'text-change' event listener to Quill
      quillRef.current?.on('text-change', (delta, oldDelta, source) => {
        if (source === 'api') {
          console.log("An API call triggered this change.");

        } else if (source === 'user') {
          console.log("A user action triggered this change.");
          const editorText = quillRef.current?.root.innerHTML;
          console.log("editorText:", editorText)
          if (editorText !== undefined) {
            handleSetText(editorText);
          }
        }
      });
    } 
  }, []);

  const handleSetText = async(editorText: string) => {
      setText(editorText);
  };

  useEffect(() => {
    console.log("text:", text)
  }, [text])
  

  const fetchVideo = async() => {
    const pendingVideo = await client.fetch(`*[_id == '${videoid}'][0]{
      videoUrl,
      isVideoReliable {
        staffReviews
      },
      cues,
      userSources,
      claims,
      _id,
      createdAt,
      postedBy
    }`);

    const pendingVideoUser = await client.fetch(`*[_id == '${pendingVideo.postedBy._ref}'][0]{
      userName,
      isUserReliable,
      _id
    }`)

    setVideo(pendingVideo);
    setUser(pendingVideoUser);
  
    //const userRefs = pendingVideos.map((video: any) => video.postedBy._ref);
    
    // const userPromises = userRefs.map((userRef: string) =>
    //   client.fetch(`*[_id == '${userRef}']`)
    // );
  
    //const users = await Promise.all(userPromises);
  
    console.log("pendingVideo:", pendingVideo);
    console.log("pendingVideoUser:", pendingVideoUser);
  }

  useEffect(() => {
    if (!video) {
      fetchVideo()
    }
  })

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    setSource(value);
  }

  const submitSource = () => {
    if (source !== '') {
      setSources(prevSources => [...prevSources, source])
      setSource('');
    }
  }

  useEffect(() => {
    console.log('sources:', sources);
  }, [sources])

  const staffReview = {
    videoId: video ? video._id : '',
    reviewedBy: reviewer,
    chosenVideoReliability: chosenVideoReliability,
    text: text,
    sources: sources,
    claimArray: claimArray,
  }

  const handleShowEditClaim = (claimIndex: number) => {
    console.log('claimIndex:', claimIndex);
  
    // Create a new array with the same length as showClaimReliability
    const updatedShowClaimReliability = new Array(video?.claims?.length).fill(false);
  
    // Set the specified index to true
    if (showClaimReliability[claimIndex] === true) {
      updatedShowClaimReliability[claimIndex] = false;
    } else {
      updatedShowClaimReliability[claimIndex] = true;
    }
  
    // Update the state with the new array
    setShowClaimReliability(updatedShowClaimReliability);
  };
  
  
  const handleReliabilityChange = (claimIndex: number, claim: string, reliability: string) => {
    console.log("newClaim value at:", claimIndex, reliability);
  
    const updatedClaimArray = [...claimArray]; // Create a copy of claimArray
    updatedClaimArray[claimIndex] = { ...updatedClaimArray[claimIndex], claim, reliability }; // Update the specific object
  
    setClaimArray(updatedClaimArray);
  };

  const options = [
    { id: 1, label: 'true' },
    { id: 2, label: 'inaccurate' },
    { id: 3, label: 'false' },
    { id: 4, label: 'unsure' },
  ];

  useEffect(() => {
    console.log('claimArray:', claimArray);

  }, [claimArray])

  useEffect(() => {
    if (claimArray.length === 0) {
      console.log("empty claimarray");
      const newClaims = video?.claims.map((claim, index) => ({
        index: index,
        claim: claim.claim,
        reliability: ''
      }));
      setClaimArray(newClaims || []);
    } else {
      console.log("claimArray:", claimArray);
    }
  }, [video]);

  const handlePreview = () => {
    // if (text === '') {
    //   setShowMissingFields(prevMissing => [...prevMissing, 'text'])
    // }
    // if (sources.length === 0) {
    //   setShowMissingFields(prevMissing => [...prevMissing, 'sources'])
    // }
    if (claimArray.some((claim) => claim.reliability === '')) {
      setShowMissingFields(prevMissing => [...prevMissing, 'claimsArray'])
    }
    if (chosenVideoReliability === '') {
      setShowMissingFields(prevMissing => [...prevMissing, 'chosenVideoReliability'])
    }
    if (claimArray.some((claim) => claim.reliability !== '') || chosenVideoReliability !== '') {
      setShowMissingFields([])
      setShowPreviewReview(true)
    }
  }

  const isMissing = text === '' || sources.length === 0 || claimArray.some((claim) => claim.reliability === '') || chosenVideoReliability === ''
  return (
    <>
      {!showPreviewReview ? (
        <>
          <button
            onClick={() => setChosenVideoReliability('true')}
            style={{width: 100, height: 50, backgroundColor: chosenVideoReliability === 'true' ? 'rgb(0, 183, 255)' : 'rgb(0, 183, 255)', opacity: chosenVideoReliability === 'true' ? 1 : 0.5, fontSize: 20 }}
          >
            True
          </button>
          <button
            onClick={() => setChosenVideoReliability('inaccurate')}
            style={{width: 100, height: 50, backgroundColor:'yellow', opacity: chosenVideoReliability === 'inaccurate' ? 1 : 0.5, fontSize: 20, alignSelf: 'center' }}
          >
            Inaccurate
          </button>
          <button
            onClick={() => setChosenVideoReliability('false')}
            style={{width: 100, height: 50, backgroundColor: 'red', opacity: chosenVideoReliability === 'false' ? 1 : 0.5,fontSize: 20 }}
          >
            False
          </button>
          <button
            onClick={() => setChosenVideoReliability('unsure')}
            style={{width: 100, height: 50, backgroundColor: 'gray', opacity: chosenVideoReliability === 'unsure' ? 1 : 0.5,fontSize: 20 }}
          >
            Unsure
          </button>
          <button
            onClick={() => setShowPreviewReview(true)}
            disabled={text === '' || sources.length === 0 || claimArray.some((claim) => claim.reliability === '') || chosenVideoReliability === ''}
            style={{width: 100, height: 50, backgroundColor: 'white', fontSize: 20, color: 'black', opacity: text === '' || sources.length === 0 || claimArray.some((claim) => claim.reliability === '') || chosenVideoReliability === '' ? 0.5 : 1 }}
            
          >
            Preview Review
          </button>
          <div style={{display: 'flex', flexDirection: 'row',width: 1000, height: 600}}> 
            <div style={{display: 'flex', flexDirection: 'column',width: 500}}> 
            <div id="editor-container" style={{ height: 300, width: 500 }} />
            {video !== null && user !== null && (
              <VideoCard video={video} user={user} />
            )}
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}> 
              <div style={{width: 600, height: 500, backgroundColor: 'black', display: 'flex', flexDirection: 'column'}}>
                <div style={{color: 'white', alignSelf: 'center', fontSize: 25}}>
                  Sources
                </div>
                <div style={{color: 'white', alignSelf: 'center'}}>Example: Genesis 1:1 </div>
                <div style={{display: 'flex', flexDirection: 'row'}}>
                  <form >
                    <input
                      style={{color: 'white', backgroundColor: 'black', textAlign: 'center', borderColor: 'white', borderWidth: 2, height: 24}}
                      value={source}
                      onChange={handleSourceChange}
                    >
                    </input>
                  </form>
                  <button
                    onClick={() => submitSource()}
                    style={{backgroundColor: 'white', padding: 5}}
                  >
                    Submit
                  </button>
                </div>
                {sources?.map((source, index) => (
                  <div style={{color: 'white', fontSize: 20}} key={index}>
                    * {source}
                  </div>
                ))}
              </div>
              <div style={{color: 'white', textAlign: 'center', fontSize: 25, borderColor: 'white', borderWidth: 2, backgroundColor: 'black', width: 600}}>
                Claims
              </div>
              <div style={{backgroundColor: 'black', overflow: 'auto'}}>
              {video?.claims?.map((claim, i) => {
                const isEmpty = claimArray[i]?.reliability === undefined || claimArray[i]?.reliability === '';
                const color = 
                  claimArray[i]?.reliability === 'true' ? 'rgb(0, 183, 255)' : 
                  claimArray[i]?.reliability === 'inaccurate' ? 'yellow' : 
                  claimArray[i]?.reliability === 'false' ? 'red' : 
                  claimArray[i]?.reliability === 'unsure' ? 'gray' : 'white'

                return (
                  <div style={{ color: 'black', fontSize: 18, width: 600 }} key={i}>
                    {!showClaimReliability[i] ? (
                      <div style={{display: 'flex', flexDirection: 'row'}}>
                        <button onClick={() => handleShowEditClaim(i)} style={{fontSize: 15}}>
                          {claim.claim}
                        </button>
                        <div style={{justifyContent: 'flex-end', color: isEmpty ? 'red' : 'green', fontSize: 20, backgroundColor: color}}>
                          {isEmpty ? (
                            <HiExclamationCircle />
                          ) : (
                            <FaCheck />
                          )}

                        </div>
                      </div>
                    ) : (
                      <div style={{display: 'flex', flexDirection: 'row'}}>
                        <div style={{ width: 200, height: 80, display: 'flex', flexDirection: 'column', color: 'white' }}>
                          {options.map(option => (
                            <label key={option.id}>
                              <input
                                style={{color: 'white'}}
                                type="radio"
                                name={`claim-${i}`} // Use a unique name for each claim
                                value={option.label}
                                checked={claimArray[i]?.reliability === option.label}
                                onChange={() => handleReliabilityChange(i, claim.claim, option.label)}
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>
                        <div style={{color: 'white', fontSize: 30}}>
                          {claim.claim}
                        </div>
                        <div onClick={() => handleShowEditClaim(i)}>
                          <GiCancel style={{color: 'white', fontSize: 30}}/>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
        <GiCancel onClick={() => setShowPreviewReview(false)} style={{fontSize: 30, color: 'red'}}/>

        <PreviewReview staffReview={staffReview}/>
        </>
      )}
    </>
  )
};

export default VideoId;
