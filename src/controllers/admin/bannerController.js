const { bannerModel } = require('../../models');

const getBanners = async (req, res) => {
  try {
    const banners = await bannerModel.getAllBanners();
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch banners' });
  }
};

const createBanner = async (req, res) => {
  try {
    const bannerId = await bannerModel.createBanner(req.body);
    res.status(201).json({ success: true, data: { id: bannerId, ...req.body } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create banner' });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const success = await bannerModel.deleteBanner(req.params.id);
    if (!success) return res.status(404).json({ success: false, error: 'Banner not found' });
    res.status(200).json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete banner' });
  }
};

const toggleBannerStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    const success = await bannerModel.toggleBannerStatus(req.params.id, is_active);
    if (!success) return res.status(404).json({ success: false, error: 'Banner not found' });
    res.status(200).json({ success: true, message: 'Banner status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update banner status' });
  }
};

const updateBanner = async (req, res) => {
  try {
    const success = await bannerModel.updateBanner(req.params.id, req.body);
    if (!success) return res.status(404).json({ success: false, error: 'Banner not found' });
    res.status(200).json({ success: true, message: 'Banner updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update banner' });
  }
};

const getBannerById = async (req, res) => {
  try {
    const banner = await bannerModel.getBannerById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, error: 'Banner not found' });
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch banner' });
  }
};

module.exports = {
  getBanners,
  getBannerById,
  createBanner,
  deleteBanner,
  toggleBannerStatus,
  updateBanner
};
