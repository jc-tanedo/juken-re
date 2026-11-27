import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Toast from 'src/components/Toast/Toast';
import { getSrsTransition } from 'src/utils/checkSrsStage';
import {
  APPRENTICE,
  GURU,
  MASTER,
  ENLIGHTENED,
  BURNED,
  TERMINOLOGY,
} from 'src/common/constants';

const DUR = 400;

const SrsStages = ({ stages, srsSystem, enabled = true } = {}) => {
  const srsApprentice = useRef(null);
  const srsGuru = useRef(null);
  const srsMaster = useRef(null);
  const srsEnlightened = useRef(null);
  const srsBurned = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const transition = getSrsTransition(
      _.get(stages, 'current'),
      _.get(stages, 'next'),
      srsSystem,
    );
    if (!transition) return;

    const { category, direction } = transition;
    const message = `${TERMINOLOGY[category]} ${direction === 'up' ? '↑' : '↓'}`;
    const refs = {
      [APPRENTICE]: srsApprentice,
      [GURU]: srsGuru,
      [MASTER]: srsMaster,
      [ENLIGHTENED]: srsEnlightened,
      [BURNED]: srsBurned,
    };
    refs[category]?.current?.show(message, DUR);
  }, [stages, srsSystem, enabled]);

  return (
    <>
      <Toast position="top" ref={srsApprentice} type={APPRENTICE} />
      <Toast position="top" ref={srsGuru} type={GURU} />
      <Toast position="top" ref={srsMaster} type={MASTER} />
      <Toast position="top" ref={srsEnlightened} type={ENLIGHTENED} />
      <Toast position="top" ref={srsBurned} type={BURNED} />
    </>
  );
};

SrsStages.propTypes = {
  stages: PropTypes.object,
  srsSystem: PropTypes.object,
  enabled: PropTypes.bool,
};

export default SrsStages;
