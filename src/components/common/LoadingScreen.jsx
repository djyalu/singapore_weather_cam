import React from 'react';
import PropTypes from 'prop-types';
import { DESIGN_TOKENS } from '../../config/constants';
import { getLocalizedString, UI_STRINGS } from '../../config/localization';

const LoadingScreen = React.memo(({ message }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <div
          className="inline-block w-16 h-16 border-4 border-singapore-red border-t-transparent rounded-full animate-spin mb-4"
          style={{ borderColor: DESIGN_TOKENS.COLORS.SINGAPORE_RED, borderTopColor: 'transparent' }}
          aria-hidden="true"
        ></div>
        <h2 className="text-xl font-semibold text-gray-700">
          {message || getLocalizedString('LOADING_WEATHER')}
        </h2>
        <p className="text-gray-500 mt-2">
          {getLocalizedString('LOADING_PLEASE_WAIT')}
        </p>
        <span className="sr-only">{getLocalizedString('LOADING_WEATHER')}</span>
      </div>
    </div>
  );
});

LoadingScreen.propTypes = {
  message: PropTypes.string,
};

LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;