import { client } from '../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

import { IVideo, IUser, IStaffVideoReview, IReport, IReportReview } from '../../homie-website/types.js'
import VideoCard from '../components/VideoCard';
import useAuthStore from '../store/authStore';
import NavBar from '../components/NavBar';
import { formatDateToMMDDYYYY } from '../components/StaffVideoReviewVideoCard';
import { getTimeAgo } from './reviewClaims';
import ReportCard from '../components/ReportCard';

interface IProps {
  reports: IReport[];
};

const ReviewReports: React.FC<IProps> = ({ reports }: IProps) => {
  const router = useRouter();
  const { userProfile, addUser, removeUser } = useAuthStore();
  const [showNavBar, setShowNavBar] = useState(false);
  const [showUnreviewed, setShowUnreviewed] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [reportUsers, setReportUsers] = useState<IUser[]>([]);
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [videoUsers, setVideoUsers] = useState<IUser[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000);

    if (reports) {
      fetchReportUsers();
    }
  }, [reports]);

  useEffect(() => {
    console.log('reportUsers:', reportUsers)
  }, [reportUsers]);
  useEffect(() => {
    console.log('videos:', videos)
  }, [videos]);
  useEffect(() => {
    console.log('videoUsers:', videoUsers)
  }, [videoUsers]);

  const fetchReportUsers = async () => {
    const users = await Promise.all(
      reports.map(async (report) => {
        const user = await client.fetch(`*[_id == '${report.postedBy._ref}'][0]`);
        return user;
      })
    );

    setReportUsers(users);
    fetchVideos(reports.map((report) => report.video._ref));
  };

  const fetchDocument = async (_ref: string) => {
    return await client.fetch(`*[_id == '${_ref}'][0]`);
  };

  const fetchVideos = async (_refs: string[]) => {
    const resolvedVideos = await Promise.all(
      _refs.map(async (ref) => {
        const video = await fetchDocument(ref);
        return video;
      })
    );
    setVideos(resolvedVideos);
    fetchVideoUsers(resolvedVideos.map((video) => video.postedBy._ref));
  };

  const fetchVideoUsers = async (_refs: string[]) => {
    const resolvedUsers = await Promise.all(
      _refs.map(async (ref) => {
        const user = await client.fetch(`*[_id == '${ref}'][0]`);
        return user;
      })
    );
    setVideoUsers(resolvedUsers);
  };


  return(
    <>
      {showNavBar ? (
        <NavBar />
      ) : (
        <div style={{height: 19, width: '100vw'}}>
        </div>
      )}
      {reports?.map((report: IReport, index) => 
        <div key={index} style={{display: 'flex', flexDirection: 'column', borderWidth: 2, borderColor: 'maroon', borderStyle: 'solid', padding: 5}}>
          <ReportCard report={report} reportUser={reportUsers[index]}/>
          {videos && videoUsers && (
            <VideoCard video={videos[index]} user={videoUsers[index]}/>
          )}
        </div>
      )}
    </>
  )
};

export default ReviewReports;

export async function getServerSideProps() {
  const reports = await client.fetch(`*[_type == 'report' && isPending == true] | order(_createdAt asc)`);
  console.log('reports:', reports);

  const props = {
    reports: reports || []
  }
  return {
    props
  }
  
}