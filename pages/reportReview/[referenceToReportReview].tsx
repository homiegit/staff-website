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
  const reportReference = router.query.referenceToReportReview;


  const [reportReview, setReportReview] = useState<IReportReview>();
  const [reportReviewStaff, setReportReviewStaff] = useState<IStaff[]>([]);
  const [report, setReport] = useState<IReport>();
  const [reportUser, setReportUser] = useState<IUser>();
  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000);

    fetchReportReview();
  }, []);

  const fetchReportReview = async() => {
    const review: IReportReview = await client.fetch(`*[_id == '${reportReference}'][0]`);

    const staffs = review.reviewedBy.map(async(staff) => {
      return await client.fetch(`*[_id == '${staff._ref}'][0]`);

    })

    const reportt: IReport = await client.fetch(`*[_id == '${review?.report._ref}'][0]`);

    const reportUser = await client.fetch(`*[_id == '${reportt?.postedBy._ref}'][0]`);

    setReportReview(review);
    setReportReviewStaff(await Promise.all(staffs));
    setReport(reportt);
    setReportUser(reportUser);
  };


  return(
    <>
      {showNavBar ? (
        <NavBar />
      ) : (
        <div style={{height: 19, width: '100vw'}}/>
      )}
      {report && reportUser && (
        <ReportCard report={report} reportUser={reportUser} />
      )}
      {reportReview && (
        reportReviewStaff.map((staff, index) =>
          <div key={index}>
            {staff.userName}
          </div>
        )
      )}
      <div>
        {reportReview?.status}
      </div>
    </>
  );
};

export default ReferenceToReportReview;