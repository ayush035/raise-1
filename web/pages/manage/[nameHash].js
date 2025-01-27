import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import * as fcl from "@onflow/fcl";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import Footer from "@/components/Footer";
import { getGrantInfoByNameHash, getRentCost } from "../../flow/scripts";
import styles from "../../styles/ManageGrant.module.css";
import {
  renewGrant,
  updateAddressForGrant,
  updateBioForGrant,sendFlow,updateImgUrlForGrant
} from "../../flow/transactions";

// constant representing seconds per year
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export default function ManageGrant() {
  // Use AuthContext to gather data for current user
  const { currentUser, isInitialized } = useAuth();

  // Next Router to get access to `nameHash` query parameter
  const router = useRouter();
  // State variable to store the GrantInfo
  const [grantInfo, setGrantInfo] = useState();
  // State variable to store the bio given by user
  const [bio, setBio] = useState("");
  const [imgurl, setImgUrl] = useState("");

  // State variable to store the address given by user
  const [linkedAddr, setLinkedAddr] = useState("");
  // State variable to store how many years to renew for
  const [renewFor, setRenewFor] = useState(1);
  // Loading state
  const [loading, setLoading] = useState(false);
  // State variable to store cost of renewal
  const [cost, setCost] = useState(0.0);
  const [years, setYears] = useState("");

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');


    
  // Function to load the grant info
  async function loadGrantInfo() {
    try {
      const info = await getGrantInfoByNameHash(
        currentUser.addr,
        router.query.nameHash
      );
      console.log(info);
      setGrantInfo(info);
    } catch (error) {
      console.error(error);
    }
  }

  async function transferTokens() {
    try {
      const txId = await sendFlow(recipient, amount);
      await fcl.tx(txId).onceSealed();
    } catch (error) {
      console.error(error);
    }
  }


  // Function which updates the bio transaction
  async function updateBio() {
    try {
      setLoading(true);
      const txId = await updateBioForGrant(router.query.nameHash, bio);
      await fcl.tx(txId).onceSealed();
      await loadGrantInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }


  async function updateImgUrl() {
    try {
      setLoading(true);
      const txId = await updateImgUrlForGrant(router.query.nameHash, imgurl);
      await fcl.tx(txId).onceSealed();
      await loadGrantInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which updates the address transaction
  async function updateAddress() {
    try {
      setLoading(true);
      const txId = await updateAddressForGrant(
        router.query.nameHash,
        linkedAddr
      );
      await fcl.tx(txId).onceSealed();
      await loadGrantInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which runs the renewal transaction
  async function renew() {
    try {
      setLoading(true);
      if (renewFor <= 0)
        throw new Error("Must be renewing for at least one year");
      const duration = (renewFor * SECONDS_PER_YEAR).toFixed(1).toString();
      const txId = await renewGrant(
        grantInfo.name.replace(".fns", ""),
        duration
      );
      await fcl.tx(txId).onceSealed();
      await loadGrantInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which calculates cost of renewal
  async function getCost() {
    if (grantInfo && grantInfo.name.replace(".fns", "").length > 0 && renewFor > 0) {
      const duration = (renewFor * SECONDS_PER_YEAR).toFixed(1).toString();
      const c = await getRentCost(
        grantInfo.name.replace(".fns", ""),
        duration
      );
      setCost(c);
    }
  }

  // Load grant info if user is initialized and page is loaded
  useEffect(() => {
    if (router && router.query && isInitialized) {
      loadGrantInfo();
    }
  }, [router]);

  // Calculate cost everytime grantInfo or duration changes
  useEffect(() => {
    getCost();
  }, [grantInfo, renewFor]);

  if (!grantInfo) return null;

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow Name Service - Manage Grant</title>
        <meta name="description" content="Flow Name Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

            {/* <div className='my-6 mx-20 text-2xl text-white font-semibold font-mono'>
              Project Details :
            </div> */}

      {/* <main className={styles.main}> */}

<div className='flex justify-center'>
<div className=' rounded-xl mx-20 my-6'>
        <img src={grantInfo.imgurl}/>
</div></div>
<main className={styles.main}>


<div className='mx-4'>
        <div className=' my-8 text-xl  text-white'>
          <div className='text-2xl font-bold my-2'>{grantInfo.name}</div>
          {/* <p className='text-xl font-semibold'>ID: {grantInfo.id}</p> */}
          <div className='flex flex-col'>
          <label className='text-white font-semibold text-xl my-2'>FOUNDER</label>
          <div className='text-xl font-bold'> {grantInfo.owner}</div>
          </div>
          <hr className=' my-6 mx-2'/>
          <div className='font-mono'> {grantInfo.bio ? grantInfo.bio : "Not Set"}</div>
        </div>
        </div>
        <div>
        <div className='flex bg-gray-900 rounded-lg shadow-lg px-4 py-6 flex-col space-y-5 w-1/2 mx-28 my-6 '>
              <div className='flex justify-center'>
                <h1 className='text-xl font-semibold text-gray-100 mb-2 fonr-mono'>FUND</h1>
                {/* <img src='/planee.png' alt='plane' /> */}
              </div>
              <div className='flex flex-col '>
                <label className='text-sm text-white'>Address</label>
                <input type="text" placeholder="Vitalik.eth"
                  className='px-4 py-2 focus:outline-none   bg-gray-800  rounded-lg '
                  onChange={e => setRecipient(e.target.value)} />
              </div>
              <div className='flex flex-col pb-2'>
                <label className='text-sm text-white'>Amount</label>
                <input type="text" placeholder="Amount $"
                  className='px-4 py-2 focus:outline-none  bg-gray-800 r rounded-lg'
                  onChange={e => setAmount(e.target.value)} />
              </div>
              <button onClick={() => transferTokens(amount, recipient)}
                className='rounded-lg text-center text-sm font-bold text-white py-2 px-16 mx-2 bg-green-600 hover:bg-green-400'
              >Transfer</button>
            </div>
        </div>


      </main>
      <hr className= 'mx-20 my-2'/>
           <div className =' flex justify-center'>
            <div className=' bg-gray-900 text-white mx-4 my-4 px-4 rounded-lg w-1/3 py-4 '>
          <div className='text-2xl font-semibold  mx-36 '>Edit ✏️</div>
          <div className='my-2'>
          <div className={styles.inputGroup} >
            <span className='text-xl font-mono'>Bio: </span>
            <input
            className='bg-slate-800'
              type="text"
              placeholder=" Text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <button onClick={updateBio} disabled={loading}  className='hover:bg-gray-800 rounded-md outline outline-offset-1 outline-gray-600'>
              Update
            </button>
          </div>
          </div>
          <div className={styles.inputGroup}>
            <span className='text-xl font-mono'>Logo: </span>
            <input
            className='bg-slate-800'
              type="text"
              placeholder=" Image URL "
              value={imgurl}
              onChange={(e) => setImgUrl(e.target.value)}
            />
            <button onClick={updateImgUrl} disabled={loading} className='rounded-md outline outline-offset-1 outline-gray-600 hover:bg-gray-800'>
              Update
            </button>
          </div>
          <br />

 <div className={styles.inputGroup}>
            <span>Fund: </span>
            <input
            className='bg-slate-800'
              type="number"
              placeholder="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
            <span className='text-xl font-mono mx-5'>Years</span>
          </div>
          </div>
          </div>
          {/* <div className={styles.inputGroup}>
            <span>Update Address: </span>
            <input
              type="text"
              placeholder="0xabcdefgh"
              value={linkedAddr}
              onChange={(e) => setLinkedAddr(e.target.value)}
            />
            <button onClick={updateAddress} disabled={loading}>
              Update
            </button>
          </div> */}

          {/* <h1>Renew</h1>
          <div className={styles.inputGroup}>
            <input
              type="number"
              placeholder="1"
              value={renewFor}
              onChange={(e) => setRenewFor(e.target.value)}
            />
            <span> years</span>
            <button onClick={renew} disabled={loading}>
              Renew Grant
            </button>
          </div>
          <p>Cost: {cost} FLOW</p>
          {loading && <p>Loading...</p>} */}

        {/* </div>
        </main> */}
        <Footer/>
    </div>
  );
}
