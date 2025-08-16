// components/HeroSection.jsx
import React from 'react';
import videoBG from '../assets/CS.mp4';
import videoBG2 from '../assets/tia2.mp4';
import Button from './Button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <div className="flex container-padding flex-col justify-start items-center h-[77dvh] sm:h-[84dvh] md:h-[82dvh] lg:h-[740px] relative">
      <video
        src={videoBG}
        type="video/mp4"
        autoPlay
        muted
        loop
        playsInline
        controls={false}
        preload="auto"
        disablePictureInPicture
        style={{ pointerEvents: 'none' }}
        className="absolute top-0 left-0 object-cover w-full h-full lg:hidden"
      ></video>
      <video
        src={videoBG2}
        type="video/mp4"
        autoPlay
        muted
        loop
        playsInline
        controls={false}
        preload="auto"
        disablePictureInPicture
        style={{ pointerEvents: 'none' }}
        className="absolute top-0 left-0 object-cover w-full h-full hidden lg:block"
      ></video>

      <div className="container quicknav flex flex-row justify-between lg:max-w-[800px] mb-[40dvh] sm:mb-38 md:mb-50 lg:mb-[50dvh] z-25">
        <Link to="/shop?category=new" className="text-white">NEW ARRIVALS</Link>
        <Link to="/shop?category=briefs" className="text-white">BRIEFS</Link>
        <Link to="/shop?category=gymwear" className="text-white">GYM WEAR</Link>
        <Link to="/shop" className="text-white">SHOP ALL</Link>
      </div>

      <div className="typography flex flex-col w-full items-center lgx:items-start space-y-3 md:space-y-4 min-lgx:space-y-[3rem] z-20">
        <h1 className="text-center lgx:text-left text-nowrap lgx:text-5xl">
          Unmatched Comfort.
          <span className="max-sm:hidden">Bold Performance.</span>
          <br />
          <span className="max-sm:text-base sm:text-3xl lg:text-5xl">Everyday Style.</span>
        </h1>
        <Link to="/shop">
          <Button
            label="SHOP NOW"
            variant="primary"
            size="medium"
            stateProp="default"
            className="w-44"
            divClassName=""
          />
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;