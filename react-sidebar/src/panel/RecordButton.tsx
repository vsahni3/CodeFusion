import React, { CSSProperties, useEffect, useState } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';

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

export interface RecordButtonProps {
  onRecord: () => void;
  recording: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ onRecord, recording }) => {
  // Remove local "clicked" state so we don't block onRecord.
  // Instead, we use a local state for animations that syncs with the parent's "recording".
  const [animState, setAnimState] = useState<boolean>(recording);
  const innerCircleAnimation = useAnimation();
  const outerCircleAnimation = useAnimation();

  // Sync our local animation state with the parent's "recording" state.
  useEffect(() => {
    setAnimState(recording);
  }, [recording]);

  useEffect(() => {
    (async () => {
      if (animState) {
        await outerCircleAnimation.start('largeCircle');
        await outerCircleAnimation.start(['pulseOut', 'pulseIn'], {
          repeat: Infinity,
          repeatType: 'mirror',
        });
      } else {
        await outerCircleAnimation.start('circle');
      }
    })();
  }, [animState, outerCircleAnimation]);

  useEffect(() => {
    (async () => {
      if (animState) {
        await innerCircleAnimation.start('square');
        await innerCircleAnimation.start('invisible');
      } else {
        await innerCircleAnimation.start('circle');
      }
    })();
  }, [animState, innerCircleAnimation]);

  const handleButtonClick = () => {
    // Always call onRecord so that parent toggles recording state.
    onRecord();
  };

  return (
    <button style={styles.pillContainer} onClick={handleButtonClick}>
      <span style={styles.text}>{recording ? 'STOP' : 'REC'}</span>
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
