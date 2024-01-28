import { client } from '../../homie-website/utils/client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import * as XLSX from 'xlsx';
import os from 'os';
import axios from "axios";
import { SERVER_IP_URL } from '../../homie-website/config';
import { VscEye, VscEyeClosed} from 'react-icons/vsc'

import { astraClient } from '../../homie-website/astra/client';
import useAuthStore from '../store/authStore';
import { IVideo, IUser, IStaff, IStaffVideoReview } from '../../homie-website/types.js'
import NavBar from '../components/NavBar';

interface Row {
  id: number;
  name: string;
  jobTitles: string[];
  totalSubmissions: number;
  videoReviews: IStaffVideoReview[];
  claimReviews: IVideo[];
}

const Payroll = () => {
  const router = useRouter();

  const { userProfile, addUser, removeUser } = useAuthStore();
  const [showFilters, setShowFilters] = useState(false);
  const [showSortBy, setShowSortBy] = useState(false);
  const [showRanges, setShowRanges] = useState(false);
  const [range, setRange] = useState('All');
  const [filters, setFilters] = useState<string[]>([]);
  const [data, setData] = useState<Row[]>([]);
  const [allData, setAllData] = useState<Row[]>([]);
  const [sortBy, setSortBy] = useState<{ key: keyof Row; order: 'asc' | 'desc' }>({
    key: 'id',
    order: 'asc',
  });
  const [showNavBar, setShowNavBar] = useState(false);


  const allJobTitles = [
    'claimReviewer',
    'videoReviewer',
    'reportReviewer',
    'administrator'
  ];
  const allSortBy = [
    'Most Frequent Reviews',
    'Least Frequent Reviews',
    'Newest Member',
    'Oldest Member',
  ];
  const allRanges = [
    'Today',
    'This Week',
    'This Month',
    'This Year',
    'All'
  ]

  useEffect(() => {
    setTimeout(() => {
      setShowNavBar(true);
    }, 1000)
  }, []);

  useEffect(() => {
    if (data.length === 0) {
      fetchData()
    }
  }, []);

  useEffect(() => {
    console.log('data:', data);

  }, [data]);

  const fetchData = async () => {
    try {
      const allStaff = await client.fetch(`*[_type == 'staff']`);
  
      const allSubmissions = await Promise.all(
        allStaff.map(async (staff: IStaff) => {
          const allVideoReviews = await client.fetch(`*[_type == 'staffVideoReview' && reviewedBy._ref == '${staff._id}']`);
         // const allClaimReviews = await client.fetch(`*[_type == 'video' && allClaims.staffReviewedClaims[*].reviewedBy._ref == '${staff._id}']`);
         const allVideos = await client.fetch(`*[_type == 'video']{
          allClaims{
            staffReviewedClaims[]
          }
         }`);

        const allClaimReviews = allVideos.filter((video:IVideo) =>
          video.allClaims?.staffReviewedClaims.some((claim) => claim.reviewedBy._ref === staff._id)
        );

          console.log(`allVideoReviews for ${staff.userName}:`, allVideoReviews);
          console.log(`allClaimReviews for ${staff.userName}:`, allClaimReviews);
          return {
            id: staff._id, // Assuming _id is a valid attribute for your data
            name: staff.userName,
            jobTitles: staff.jobTitles,
            totalSubmissions: allVideoReviews.length + allClaimReviews.length,
            videoReviews: allVideoReviews,
            claimReviews: allClaimReviews
          };
        })
      );
  
      setData(allSubmissions);
      setAllData(allSubmissions);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  

  const handleSort = (key: keyof Row) => {
    // Toggle sorting order if the same column is clicked again
    const newOrder = sortBy.key === key && sortBy.order === 'asc' ? 'desc' : 'asc';

    // Sort the data based on the selected key and order
    const sortedData = [...data].sort((a, b) => {
      if (newOrder === 'asc') {
        return (a[key] as number) - (b[key] as number);
      } else {
        return (b[key] as number) - (a[key] as number);
      }
    });    

    setData(sortedData);
    setSortBy({ key, order: newOrder });
  };

  const handleRange = (range: string) => {
    setRange(range);

  
    const updatedData = allData.map((row) => {
      const filteredVideoReviews = filterReviews(row.videoReviews, range);
      const filteredClaimReviews = filterReviews(row.claimReviews, range);
      console.log('filteredVideoReviews:', filteredVideoReviews);
      console.log('filteredClaimReviews:', filteredClaimReviews);

      // Explicitly specify the types here
      const videoReviews: IStaffVideoReview[] = filteredVideoReviews as IStaffVideoReview[];
      const claimReviews: IVideo[] = filteredClaimReviews as IVideo[];

      return {
        ...row,
        videoReviews,
        claimReviews,
        totalSubmissions: videoReviews.length + claimReviews.length
      };
    });
  
    setData(updatedData);
    //setShowRanges(false);
  };  
  
  const filterReviews = (reviews: (IStaffVideoReview[] | IVideo[]), range: string) => {
    const currentDate = new Date();
    let filterDate: Date;
  
    switch (range) {
      case 'Today':
        filterDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        break;
      case 'This Week':
        filterDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
      case 'This Month':
        filterDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        break;
      case 'This Year':
        filterDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
        break;
      case 'All':
        filterDate = new Date(0); // A date far in the past
        break;
      default:
        filterDate = new Date(0);
        break;
    }
  
    if (Array.isArray(reviews)) {
      if (reviews.length === 0) {
        return [];
      };

      console.log('filterDate:', filterDate);
  
      if ('_createdAt' in reviews[0]) {
        // It's an array of IStaffVideoReview
        return (reviews as IStaffVideoReview[]).filter((review, index) => {
          console.log(`staff video review at ${index}:`, review);
          console.log('date:', new Date(review.completedAt));
  
          return new Date(review.completedAt) >= filterDate; // Return true or false based on the comparison
        });
      } else if ('allClaims' in reviews[0]) {
        // It's an array of IVideo
        return (reviews as IVideo[]).filter((review, index) => {
          console.log(`video at ${index}:`, review);
          return review.allClaims.staffReviewedClaims.some((claim) => {
            console.log('date:', new Date(claim.completedAt));
  
            return new Date(claim.completedAt) >= filterDate; // Return true or false based on the comparison
          });
        });
      }
    }
  
    return [];
  };
  
  const handleFilter = (filter: string) => {
    console.log(filter);
  
    // Toggle the filter in the filters array
    const updatedFilters = filters.includes(filter)
      ? filters.filter(item => item !== filter)
      : [...filters, filter];
  
    // Apply the filter immediately
    const filteredData = allData.filter(data => updatedFilters.every(filterItem => data.jobTitles.includes(filterItem)));
  
    // Update both filters and data state
    setFilters(updatedFilters);
    setData(filteredData);
  };

  return(
    <>
      {showNavBar ? (
        <NavBar /> 
      ) : (
        <div style={{height: 19, width: '100vw'}}>
        </div>
      )}
      <div style={{width: '70vw', height: '70vh', display: 'flex', flexDirection: 'column', alignSelf: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <button onClick={() => {setShowFilters(!showFilters), setShowRanges(false)}}>
            Filters
          </button>
          <button onClick={() => setShowSortBy(!showSortBy)}>
            Sort By
            {sortBy && (
              <div>
                {sortBy.order}
              </div>
            )}
          </button>
          <button onClick={() => {setShowRanges(!showRanges), setShowFilters(false)}}>
            Range:
            {range}
          </button>
        </div>
        {showFilters && (
          <div style={{width: '20vw', height: '20vh', display: 'flex', flexDirection: 'column'}}>
            {allJobTitles.map((title, index) =>
              <button
                onClick={() => handleFilter(title)}
                style={{backgroundColor: filters.includes(title) ? 'blue' : 'darkgray'}} key={index}>
                {title}
              </button>
            )}
          </div>
        )}
        {/* {showSortBy && (
          <div style={{width: '20vw', height: '20vh', display: 'flex', flexDirection: 'column'}}>

          </div>
        )} */}
        {showRanges && (
          <div style={{width: '20vw', height: '20vh', display: 'flex', flexDirection: 'column'}}>
            {allRanges.map((rang, index) => 
              <button onClick={() => handleRange(rang)} style={{backgroundColor: rang === range ? 'blue': 'darkgray'}} key={index}>
                {rang}
              </button>
            )}
          </div>

        )}
        <div style={{display: 'flex', flexDirection: 'row'}}>
          {filters.map((filter: string, index: number) => 
            <button onClick={() => handleFilter(filter)} key={index}>
              {filter}
            </button>
          )}
        </div>
        <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} className={sortBy.key === 'name' ? 'sorted' : ''}>
              Name {sortBy.key === 'name' && (sortBy.order === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('jobTitles')} className={sortBy.key === 'jobTitles' ? 'sorted' : ''}>
              Job Titles {sortBy.key === 'jobTitles' && (sortBy.order === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('totalSubmissions')} className={sortBy.key === 'totalSubmissions' ? 'sorted' : ''}>
              Total Submissions {sortBy.key === 'totalSubmissions' && (sortBy.order === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('videoReviews')} className={sortBy.key === 'videoReviews' ? 'sorted' : ''}>
              Video Reviews {sortBy.key === 'videoReviews' && (sortBy.order === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('claimReviews')} className={sortBy.key === 'claimReviews' ? 'sorted' : ''}>
              Claim Reviews {sortBy.key === 'claimReviews' && (sortBy.order === 'asc' ? '▲' : '▼')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td style={{textAlign: 'center', fontSize: 25}}>
                {row.name}
              </td>
              <td style={{textAlign: 'center', fontSize: 25}}>
                {row.jobTitles.map((title, index)=> 
                  <div style={{textAlign: 'center', fontSize: 15}} key={index}> {title}</div>
                )}
              </td>
              <td style={{textAlign: 'center', fontSize: 25}}>
                {row.totalSubmissions}
              </td>
              <td style={{textAlign: 'center', fontSize: 25}}>
                {row.videoReviews.length}
              </td>
              <td style={{textAlign: 'center', fontSize: 25}}>
                {row.claimReviews.length}
              </td>
            </tr>
          ))}
        </tbody>
        </table>

      </div>
    </>
  )
};

export default Payroll