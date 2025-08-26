import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PrivacyPolicy, TermsAndConditions, CancellationRefund, ShippingDelivery } from '../pages/policies';

const PolicyRoutes = () => {
  return (
    <Routes>
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/cancellation-refund" element={<CancellationRefund />} />
      <Route path="/shipping-delivery" element={<ShippingDelivery />} />
    </Routes>
  );
};

export default PolicyRoutes;
