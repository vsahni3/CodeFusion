import React, { CSSProperties, useState, useEffect } from 'react';
import { motion, useAnimation, Variants, AnimationControls } from 'framer-motion';

const RED_COLOR = `#FF214D`;

const outerCircleVariants: Variants = {
  circle: {
    transform: 'scale(1)',
    opacity: 0.5,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  },
  largeCircle: {
    transform: 'scale(1.1)',
    opacity: 1,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  },
  pulseIn: {
    transform: 'scale(1.1)',
    opacity: 1,
    boxShadow: `0px 0px 0px 20px ${RED_COLOR}`,
  },
  pulseOut: {
    transform: 'scale(1.1)',
    opacity: 1,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  },
};

const innerCircleVariants: Variants = {
  circle: {
    transform: 'scale(1)',
    borderRadius: '100%',
  },
  square: {
    transform: 'scale(0.8)',
    borderRadius: '30%',
  },
  invisible: {
    transform: 'scale(0)',
    borderRadius: '100%',
  },
};

interface RecordButtonProps {
  onRecord?: () => void;
  // Optionally, if you want to add a stop callback later:
  // onStop?: () => void;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ onRecord }) => {
  const [clicked, setClicked] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState('REC');
  const innerCircleAnimation: AnimationControls = useAnimation();
  const outerCircleAnimation: AnimationControls = useAnimation();

  useEffect(() => {
    (async () => {
      if (clicked) {
        await outerCircleAnimation.start('largeCircle');
        await outerCircleAnimation.start(['pulseOut', 'pulseIn'], {
          repeat: Infinity,
          repeatType: 'mirror',
        });
      } else {
        await outerCircleAnimation.start('circle');
      }
    })();
  }, [clicked, outerCircleAnimation]);

  useEffect(() => {
    (async () => {
      if (clicked) {
        await innerCircleAnimation.start('square');
        await innerCircleAnimation.start('invisible');
      } else {
        await innerCircleAnimation.start('circle');
      }
    })();
  }, [clicked, innerCircleAnimation]);

  const handleButtonClick = () => {
    // If we are about to start recording, call the onRecord callback.
    if (!clicked && onRecord) {
      onRecord();
    }
    // Toggle recording state and update the button text.
    setClicked(prev => !prev);
    setButtonText(prev => (prev === 'REC' ? 'STOP' : 'REC'));
  };

  return (
    <button style={styles.pillContainer} onClick={handleButtonClick}>
      <span style={styles.text}>{buttonText}</span>
      <motion.div style={styles.container} drag>
        <motion.div
          initial="circle"
          animate={outerCircleAnimation}
          variants={outerCircleVariants}
          style={{ ...styles.circle, ...styles.outerCircle }}
        />
        <motion.div
          initial="circle"
          animate={innerCircleAnimation}
          variants={innerCircleVariants}
          style={{ ...styles.circle, ...styles.innerCircle }}
        />
      </motion.div>
    </button>
  );
};

const styles: Record<string, CSSProperties> = {
  pillContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '2px solid #FFFFFF',
    borderRadius: 70,
    padding: '35px 50px',
    width: '420px',
  },
  text: {
    color: '#FFFFFF',
    fontSize: '70px',
    fontWeight: 'bold',
    marginRight: 42,
  },
  container: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
    cursor: 'pointer',
  },
  circle: {
    position: 'absolute',
  },
  outerCircle: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 9999,
  },
  innerCircle: {
    width: '90%',
    height: '90%',
    overflow: 'hidden',
    backgroundColor: RED_COLOR,
  },
};
