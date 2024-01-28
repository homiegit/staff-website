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
import { getTimeAgo } from '../pages/reviewClaims';

interface IProps {
  report: IReport;
  reportUser: IUser;
}
const ReportCard = ({report, reportUser}: IProps) => {
  const router = useRouter();

  const { userProfile, addUser, removeUser } = useAuthStore();

  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000);
  }, []);


  const handlePush = async(_ref: string) => {
    
    if (report && userProfile) {
      if (report.isPending === undefined || report.isPending === true) {
        let id = '';
        const uuid = uuidv4();
        id = uuid.toString();

        await client.patch(_ref).set({isPending: true}).commit();

        const reportReviewObject = {
          _type: 'reportReview',
          _id: id,
          reviewedBy: [
            {
              _ref: userProfile._id,
              _key: uuidv4().toString()
            }
          ],
          report: {
            _ref: _ref
          },
          actionTook: '',
          status: ''
        }
        await client.create(reportReviewObject);

        router.push(`/reportReview/${id}`);
      
      } else {
        const reportReview: IReportReview[] = await client.fetch(`*[report._ref == '${report._id}']`)

        if (reportReview.length === 1) {
          router.push(`/reportReview/${reportReview[0]._id}`);
        } else {
          // Multiple Report Reviews created 
        }

      }
    }
  }

  return(
    <>
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <div style={{display: 'flex', flexDirection: 'column', width: '20vw'}}>
          <Link href={`/profile/${report?.postedBy._ref}`}>
            <div>
              {reportUser?.userName}
            </div>
          </Link>
          <div>
            {report?.typeOfReport}
          </div>
          <div>
            {formatDateToMMDDYYYY(report?._createdAt)}
          </div>
        </div>
        <div style={{width: '50vw'}}>
          {report?.text}
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <button onClick={() => handlePush(report._id)}>
            Take action
          </button>
          <div>
            {getTimeAgo(report?._createdAt)} ago
          </div>
        </div>
      </div>
    </>
  )
};

export default ReportCard;