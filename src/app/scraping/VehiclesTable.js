'use client';

import { useState, useEffect } from 'react';
import { 
  FaFilter, 
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaTimes,
  FaImages
} from 'react-icons/fa';
import { getVehicles, getVehicleImages } from '@/lib/scraping';
import { authenticatedFetch } from '@/lib/auth';

export default function VehiclesTable() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [vehicleImages, setVehicleImages] = useState(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState('');
  
  // Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [drivetrain, setDrivetrain] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [isElectric, setIsElectric] = useState('');
  const [minMpg, setMinMpg] = useState('');
  const [maxMpg, setMaxMpg] = useState('');
  const [hasFueleconomy, setHasFueleconomy] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        page,
        limit,
        search: search || undefined,
        year: year || undefined,
        make: make || undefined,
        model: model || undefined,
        bodyType: bodyType || undefined,
        drivetrain: drivetrain || undefined,
        fuelType: fuelType || undefined,
        isElectric: isElectric !== '' ? isElectric : undefined,
        minMpg: minMpg || undefined,
        maxMpg: maxMpg || undefined,
        hasFueleconomy: hasFueleconomy !== '' ? hasFueleconomy : undefined,
        sortBy,
        sortOrder,
      };
      
      const data = await getVehicles(filters);
      // API returns { success: true, data: [...], pagination: {...} }
      setVehicles(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, limit, sortBy, sortOrder]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchVehicles();
  };

  const handleClearFilters = () => {
    setSearch('');
    setYear('');
    setMake('');
    setModel('');
    setBodyType('');
    setDrivetrain('');
    setFuelType('');
    setIsElectric('');
    setMinMpg('');
    setMaxMpg('');
    setHasFueleconomy('');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <FaSort className="w-4 h-4 text-slate-500" />;
    }
    return sortOrder === 'asc' 
      ? <FaSortUp className="w-4 h-4 text-blue-400" />
      : <FaSortDown className="w-4 h-4 text-blue-400" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get unique values for dropdowns from vehicles
  const bodyTypes = [...new Set(vehicles.map(v => v.bodyType).filter(Boolean))].sort();
  const fuelTypes = [...new Set(vehicles.map(v => v.metrics?.fuelType).filter(Boolean))].sort();
  const drivetrains = [...new Set(vehicles.map(v => v.drivetrain).filter(Boolean))].sort();
  const makes = [...new Set(vehicles.map(v => v.make).filter(Boolean))].sort();
  const years = [...new Set(vehicles.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Filters Section - Collapsible */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FaFilter className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-200">Filters</h2>
          </div>
          {filtersExpanded ? (
            <FaChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <FaChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {filtersExpanded && (
          <div className="px-6 pb-6 border-t border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Make, model, trim..."
                className="
                  w-full pl-10 pr-4 py-2
                  bg-slate-900/50 border border-slate-700/50
                  rounded-lg
                  text-slate-100 placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  focus:border-blue-500/50
                "
              />
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Year
            </label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 2024"
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            />
          </div>

          {/* Make */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Make
            </label>
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g., BMW"
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Model
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., X3 M"
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            />
          </div>

          {/* Body Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Body Type
            </label>
            <input
              type="text"
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              placeholder="e.g., SUV"
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            />
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fuel Type
            </label>
            <input
              type="text"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              placeholder="e.g., Premium"
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            />
          </div>

          {/* MPG Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Min MPG
            </label>
            <input
              type="number"
              value={minMpg}
              onChange={(e) => setMinMpg(e.target.value)}
              placeholder="Min"
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max MPG
            </label>
            <input
              type="number"
              value={maxMpg}
              onChange={(e) => setMaxMpg(e.target.value)}
              placeholder="Max"
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            />
          </div>

          {/* Has Fueleconomy */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Has Fueleconomy
            </label>
            <select
              value={hasFueleconomy}
              onChange={(e) => setHasFueleconomy(e.target.value)}
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Results Per Page
            </label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleApplyFilters}
                className="
                  px-6 py-2
                  bg-gradient-to-r from-blue-500 to-blue-600
                  hover:from-blue-400 hover:to-blue-500
                  text-white font-semibold
                  rounded-lg
                  transition-all duration-300
                  flex items-center gap-2
                "
              >
                <FaSearch className="w-4 h-4" />
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="
                  px-6 py-2
                  bg-slate-700/50 hover:bg-slate-700
                  text-slate-300 font-semibold
                  rounded-lg
                  transition-all duration-300
                "
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      {/* Vehicles Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No vehicles found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('year')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Year {getSortIcon('year')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('make')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Make {getSortIcon('make')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('model')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Model {getSortIcon('model')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Trim
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Body Type
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('metrics.combinedMpg')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        MPG {getSortIcon('metrics.combinedMpg')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Fueleconomy
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Created {getSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {vehicles.map((vehicle) => (
                    <tr
                      key={vehicle._id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-300">{vehicle.year || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-200 font-medium">
                        {vehicle.make || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-200 font-medium">
                        {vehicle.model || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {vehicle.trim || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {vehicle.bodyType || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {vehicle.metrics?.combinedMpg || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {vehicle.metrics?.fuelType || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {vehicle.dataSource?.fueleconomy ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <FaCheckCircle className="w-4 h-4" />
                            Yes
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-sm">
                            <FaTimesCircle className="w-4 h-4" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(vehicle.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setModalOpen(true);
                            }}
                            className="
                              px-4 py-2
                              bg-blue-500/20 hover:bg-blue-500/30
                              text-blue-300 font-medium text-sm
                              rounded-lg
                              transition-all duration-300
                              flex items-center gap-2
                            "
                          >
                            <FaEye className="w-4 h-4" />
                            View Details
                          </button>
                          {vehicle.fuelApiVehicleId && (
                            <button
                              onClick={async () => {
                                setImagesLoading(true);
                                setImagesError('');
                                setSelectedVehicle(vehicle);
                                setImagesModalOpen(true);
                                try {
                                  // Try using vehicle ID first, fallback to fuelApiVehicleId
                                  let imagesData;
                                  try {
                                    imagesData = await getVehicleImages(vehicle._id);
                                  } catch (e) {
                                    // If that fails, try using fuelApiVehicleId
                                    if (vehicle.fuelApiVehicleId) {
                                      const response = await authenticatedFetch(
                                        `/api/v1/vehicles/fuel-api/${vehicle.fuelApiVehicleId}/images`
                                      );
                                      if (!response.ok) throw new Error('Failed to fetch images');
                                      imagesData = await response.json();
                                    } else {
                                      throw e;
                                    }
                                  }
                                  
                                  // Handle response structure - API returns data directly
                                  if (imagesData.data) {
                                    setVehicleImages(imagesData.data);
                                  } else if (imagesData.availableProducts) {
                                    setVehicleImages(imagesData);
                                  } else {
                                    setVehicleImages(imagesData);
                                  }
                                } catch (err) {
                                  setImagesError(err.message || 'Failed to load images');
                                  setVehicleImages(null);
                                } finally {
                                  setImagesLoading(false);
                                }
                              }}
                              className="
                                px-4 py-2
                                bg-purple-500/20 hover:bg-purple-500/30
                                text-purple-300 font-medium text-sm
                                rounded-lg
                                transition-all duration-300
                                flex items-center gap-2
                              "
                            >
                              <FaImages className="w-4 h-4" />
                              View Images
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="
                px-6 py-4
                bg-slate-900/50 border-t border-slate-700/50
                flex items-center justify-between
              ">
                <div className="text-sm text-slate-400">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalVehicles)} of{' '}
                  {pagination.totalVehicles} vehicles
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage || loading}
                    className="
                      px-4 py-2
                      bg-slate-700/50 hover:bg-slate-700
                      text-slate-300
                      rounded-lg
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300
                      flex items-center gap-2
                    "
                  >
                    <FaChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="px-4 py-2 text-sm text-slate-300">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNextPage || loading}
                    className="
                      px-4 py-2
                      bg-slate-700/50 hover:bg-slate-700
                      text-slate-300
                      rounded-lg
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300
                      flex items-center gap-2
                    "
                  >
                    Next
                    <FaChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Vehicle Details Modal */}
      {modalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="
            bg-slate-800 border border-slate-700/50 rounded-lg
            w-full max-w-4xl max-h-[90vh] overflow-hidden
            flex flex-col
            shadow-2xl
          ">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-200">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h2>
                <p className="text-slate-400 mt-1">{selectedVehicle.trim}</p>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedVehicle(null);
                }}
                className="
                  p-2 rounded-lg
                  text-slate-400 hover:text-slate-200
                  hover:bg-slate-700/50
                  transition-colors
                "
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-slate-900/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Year</p>
                      <p className="text-slate-200 font-medium">{selectedVehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Make</p>
                      <p className="text-slate-200 font-medium">{selectedVehicle.make}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Model</p>
                      <p className="text-slate-200 font-medium">{selectedVehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Trim</p>
                      <p className="text-slate-200 font-medium">{selectedVehicle.trim || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Body Type</p>
                      <p className="text-slate-200 font-medium">{selectedVehicle.bodyType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Drivetrain</p>
                      <p className="text-slate-200 font-medium">{selectedVehicle.drivetrain || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Number of Doors</p>
                      <p className="text-slate-200 font-medium">{selectedVehicle.numDoors || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Vehicle ID</p>
                      <p className="text-slate-200 font-medium text-xs">{selectedVehicle._id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Fuel API ID</p>
                      <p className="text-slate-200 font-medium">{selectedVehicle.fuelApiVehicleId || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                {selectedVehicle.metrics && (
                  <div className="bg-slate-900/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Fuel Economy Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">City MPG</p>
                        <p className="text-slate-200 font-medium text-xl">{selectedVehicle.metrics.cityMpg || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Highway MPG</p>
                        <p className="text-slate-200 font-medium text-xl">{selectedVehicle.metrics.highwayMpg || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Combined MPG</p>
                        <p className="text-slate-200 font-medium text-xl">{selectedVehicle.metrics.combinedMpg || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Fuel Type</p>
                        <p className="text-slate-200 font-medium">{selectedVehicle.metrics.fuelType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Annual Fuel Cost</p>
                        <p className="text-slate-200 font-medium">${selectedVehicle.metrics.annualFuelCost?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">CO2 Emissions</p>
                        <p className="text-slate-200 font-medium">{selectedVehicle.metrics.co2Emissions || 'N/A'} g/mi</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Electric</p>
                        <p className="text-slate-200 font-medium">
                          {selectedVehicle.metrics.isElectric ? (
                            <span className="text-green-400">Yes</span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </p>
                      </div>
                      {selectedVehicle.metrics.electricRange && (
                        <div>
                          <p className="text-sm text-slate-400">Electric Range</p>
                          <p className="text-slate-200 font-medium">{selectedVehicle.metrics.electricRange} mi</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Data Sources */}
                {selectedVehicle.dataSource && (
                  <div className="bg-slate-900/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Data Sources</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        {selectedVehicle.dataSource.fuelApi ? (
                          <FaCheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <FaTimesCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="text-slate-200">Fuel API</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedVehicle.dataSource.fueleconomy ? (
                          <FaCheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <FaTimesCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="text-slate-200">Fueleconomy API</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fuel API Details */}
                {selectedVehicle.fuelApi && (
                  <div className="bg-slate-900/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Fuel API Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-400">ID</p>
                          <p className="text-slate-200 font-medium">{selectedVehicle.fuelApi.id}</p>
                        </div>
                        {selectedVehicle.fuelApi.model && (
                          <>
                            <div>
                              <p className="text-sm text-slate-400">Model Year</p>
                              <p className="text-slate-200 font-medium">{selectedVehicle.fuelApi.model.year}</p>
                            </div>
                            {selectedVehicle.fuelApi.model.make && (
                              <div>
                                <p className="text-sm text-slate-400">Make ID</p>
                                <p className="text-slate-200 font-medium">{selectedVehicle.fuelApi.model.make.id}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {selectedVehicle.fuelApi.products && selectedVehicle.fuelApi.products.length > 0 && (
                        <div>
                          <p className="text-sm text-slate-400 mb-2">Available Products</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {selectedVehicle.fuelApi.products.map((product, idx) => (
                              <div key={idx} className="bg-slate-800/50 rounded p-3">
                                <p className="text-slate-200 font-medium">{product.name}</p>
                                <p className="text-xs text-slate-400">{product.type} • {product.formats_count} formats</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fueleconomy Details */}
                {selectedVehicle.fueleconomy && (
                  <div className="bg-slate-900/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Fueleconomy API Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedVehicle.fueleconomy.id && (
                          <div>
                            <p className="text-sm text-slate-400">ID</p>
                            <p className="text-slate-200 font-medium">{selectedVehicle.fueleconomy.id}</p>
                          </div>
                        )}
                        {selectedVehicle.fueleconomy.cylinders && (
                          <div>
                            <p className="text-sm text-slate-400">Cylinders</p>
                            <p className="text-slate-200 font-medium">{selectedVehicle.fueleconomy.cylinders}</p>
                          </div>
                        )}
                        {selectedVehicle.fueleconomy.displ && (
                          <div>
                            <p className="text-sm text-slate-400">Displacement</p>
                            <p className="text-slate-200 font-medium">{selectedVehicle.fueleconomy.displ}L</p>
                          </div>
                        )}
                        {selectedVehicle.fueleconomy.trany && (
                          <div>
                            <p className="text-sm text-slate-400">Transmission</p>
                            <p className="text-slate-200 font-medium">{selectedVehicle.fueleconomy.trany}</p>
                          </div>
                        )}
                        {selectedVehicle.fueleconomy.VClass && (
                          <div>
                            <p className="text-sm text-slate-400">Vehicle Class</p>
                            <p className="text-slate-200 font-medium">{selectedVehicle.fueleconomy.VClass}</p>
                          </div>
                        )}
                        {selectedVehicle.fueleconomy.drive && (
                          <div>
                            <p className="text-sm text-slate-400">Drive</p>
                            <p className="text-slate-200 font-medium">{selectedVehicle.fueleconomy.drive}</p>
                          </div>
                        )}
                      </div>
                      {selectedVehicle.fueleconomy.emissionsList && selectedVehicle.fueleconomy.emissionsList.emissionsInfo && (
                        <div>
                          <p className="text-sm text-slate-400 mb-2">Emissions Standards</p>
                          <div className="space-y-2">
                            {selectedVehicle.fueleconomy.emissionsList.emissionsInfo.map((emission, idx) => (
                              <div key={idx} className="bg-slate-800/50 rounded p-3">
                                <p className="text-slate-200 font-medium">{emission.stdText}</p>
                                <p className="text-xs text-slate-400">Score: {emission.score} • Sales Area: {emission.salesArea}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-slate-900/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">Timestamps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Created At</p>
                      <p className="text-slate-200 font-medium">{formatDate(selectedVehicle.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Updated At</p>
                      <p className="text-slate-200 font-medium">{formatDate(selectedVehicle.updatedAt)}</p>
                    </div>
                    {selectedVehicle.lastFetched && (
                      <div>
                        <p className="text-sm text-slate-400">Last Fetched</p>
                        <p className="text-slate-200 font-medium">{formatDate(selectedVehicle.lastFetched)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Images Modal */}
      {imagesModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="
            bg-slate-800 border border-slate-700/50 rounded-lg
            w-full max-w-6xl max-h-[90vh] overflow-hidden
            flex flex-col
            shadow-2xl
          ">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-200">
                  Vehicle Images
                </h2>
                <p className="text-slate-400 mt-1">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </p>
              </div>
              <button
                onClick={() => {
                  setImagesModalOpen(false);
                  setVehicleImages(null);
                  setImagesError('');
                }}
                className="
                  p-2 rounded-lg
                  text-slate-400 hover:text-slate-200
                  hover:bg-slate-700/50
                  transition-colors
                "
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {imagesLoading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                  <p className="text-slate-400 mt-4">Loading images...</p>
                </div>
              ) : imagesError ? (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
                  {imagesError}
                </div>
              ) : !vehicleImages || !vehicleImages.availableProducts || vehicleImages.availableProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <FaImages className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No images available for this vehicle</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Summary Stats */}
                  <div className="bg-slate-900/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Total Products</p>
                        <p className="text-2xl font-bold text-slate-200">
                          {vehicleImages.totalProducts || vehicleImages.availableProducts?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Products with Images</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {vehicleImages.productsWithImages || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Total Formats</p>
                        <p className="text-2xl font-bold text-slate-200">
                          {vehicleImages.availableProducts?.reduce((sum, p) => sum + (p.formats?.length || 0), 0) || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Total Assets</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {vehicleImages.availableProducts?.reduce((sum, p) => 
                            sum + (p.formats?.reduce((fSum, f) => fSum + (f.assetsCount || 0), 0) || 0), 0
                          ) || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Products List */}
                  {vehicleImages.availableProducts.map((product, productIdx) => {
                    const totalFormats = product.formats?.length || 0;
                    const totalAssets = product.formats?.reduce((sum, f) => sum + (f.assetsCount || 0), 0) || 0;
                    
                    return (
                      <div key={productIdx} className="bg-slate-900/50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-200">
                              {product.name || `Product ${product.id}`}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                              Type: {product.type || 'N/A'} • {totalFormats} formats • {totalAssets} total assets
                            </p>
                          </div>
                          <div className="px-4 py-2 bg-purple-500/20 rounded-lg">
                            <p className="text-purple-300 font-semibold">{totalAssets}</p>
                            <p className="text-xs text-purple-400">assets</p>
                          </div>
                        </div>
                        
                        {product.formats && product.formats.length > 0 ? (
                          <div className="space-y-4">
                            {product.formats.map((format, formatIdx) => (
                              <div key={formatIdx} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="text-md font-medium text-slate-200">
                                      {format.name || format.code || `Format ${format.id}`}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-2">
                                      {format.width && format.height && (
                                        <span className="text-xs text-slate-400">
                                          {format.width} × {format.height}
                                        </span>
                                      )}
                                      {format.code && (
                                        <span className="text-xs text-slate-500 font-mono">
                                          {format.code}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-blue-400">
                                        {format.assetsCount || 0}
                                      </p>
                                      <p className="text-xs text-slate-400">assets</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Show color breakdown if available */}
                                {format.assets && format.assets.length > 0 && format.assets[0]?.shotCode?.color ? (
                                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <p className="text-xs text-slate-400 mb-3">Available Colors:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {(() => {
                                        const colorMap = new Map();
                                        format.assets.forEach(asset => {
                                          if (asset.shotCode?.color) {
                                            const color = asset.shotCode.color;
                                            if (!colorMap.has(color.code)) {
                                              colorMap.set(color.code, {
                                                color: color,
                                                count: 0
                                              });
                                            }
                                            colorMap.get(color.code).count++;
                                          }
                                        });

                                        return Array.from(colorMap.values()).map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-700/50"
                                          >
                                            <div
                                              className="w-6 h-6 rounded border border-slate-600 flex-shrink-0"
                                              style={{ backgroundColor: `#${item.color.rgb1}` }}
                                            />
                                            <div>
                                              <p className="text-xs font-medium text-slate-200">
                                                {item.color.simple_name}
                                              </p>
                                              <p className="text-xs text-slate-400">
                                                {item.count} images
                                              </p>
                                            </div>
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                  </div>
                                ) : format.assetsCount > 0 ? (
                                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <p className="text-xs text-slate-400">
                                      {format.assetsCount} image{format.assetsCount !== 1 ? 's' : ''} available
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <p className="text-xs text-slate-400 italic">No assets available</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm">No formats available</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
