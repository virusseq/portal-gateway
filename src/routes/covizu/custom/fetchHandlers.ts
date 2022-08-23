import axios from 'axios';
import urlJoin from 'url-join';
import getAppConfig from '../../../config/global';
import { ClusterItem } from './types';
import { COVIZU_VERSION } from './utils';

// covizu customizations for virusseq

const config = getAppConfig();

const axiosCovizu = axios.create({
  headers: {
    'Cache-Control': 'no-cache',
    Expires: '0',
    Pragma: 'no-cache',
  },
  method: 'GET',
});

// setup - find out the latest version of the data

const dataUrlBase = urlJoin(config.covizu.dataUrl, COVIZU_VERSION);
const fileListUrl = `${config.covizu.fileListUrl}?format=json&prefix=${COVIZU_VERSION}/clusters.20`;
const clustersFilenameTest = /^(\d+\.){2}\d+\/(clusters\.)\d{4}(-\d{2}){2}(\.json)$/;
const dateTest = /\d{4}(-\d{2}){2}/;

export const getDataVersion = async () => {
  // fetch a list of files to find out the most recent date,
  // but you only need to fetch one type of file.
  // assume that timetree, dbstats, and clusters files
  // all have the same date in the filename.
  // *** returns max 1000 files ***
  try {
    const { data: fileList } = (await axiosCovizu.get(fileListUrl).catch((reason) => {
      console.log('Error:', reason);
    })) || { data: [] };
    const clusterNames = fileList
      .map((file: ClusterItem) => file.name)
      .filter((clusterName: string) => clustersFilenameTest.test(clusterName))
      .sort();
    const latestDate = clusterNames?.[clusterNames?.length - 1]?.match(dateTest)?.[0] || '';
    return latestDate;
  } catch (e) {
    console.error('covizu error:', e);
    throw new Error(e as string);
  }
};

export const fetchCovizu = async (path: string) => {
  const url = urlJoin(dataUrlBase, path);
  try {
    const res = await axiosCovizu({
      url,
    });
    return res.data;
  } catch (e) {
    console.error('covizu error:', e);
    throw new Error(e as string);
  }
};
