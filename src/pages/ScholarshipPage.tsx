import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  Container, 
  FormControl, 
  Grid, 
  InputAdornment,
  MenuItem, 
  Select, 
  SelectChangeEvent, 
  TextField, 
  Typography, 
  useTheme, 
  alpha,
  Dialog,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  EmojiEvents as EmojiEventsIcon,
  ArrowForward as ArrowForwardIcon,
  EmojiEvents as AwardIcon,
  School as SchoolIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  WorkspacePremium as PremiumIcon,
  LocalOffer as OfferIcon,
  CalendarMonth as CalendarIcon,
  Public as PublicIcon,
  Event as EventIcon,
  Quiz as QuizIcon,
  CardGiftcard as CardGiftcardIcon,
  Groups as GroupsIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  CheckCircle
} from '@mui/icons-material';
import { ScholarshipApplicationForm } from '../components/scholarship/ScholarshipApplicationForm';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { account } from '../Services/appwrite';
import { DATABASE_ID, SCHOLARSHIP_APPLICATIONS_COLLECTION_ID } from '../appwriteConfig';
import { Query } from 'appwrite';

// Custom styled components
const GlassCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'rgba(25, 25, 35, 0.6)' 
    : 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(12px)',
  borderRadius: '24px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 48px 0 rgba(0, 0, 0, 0.15)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  borderRadius: '12px',
  padding: '12px 28px',
  fontWeight: 700,
  textTransform: 'none',
  color: 'white',
  boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.2)',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: '48px',
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.mode === 'dark' ? '#818cf8' : '#4f46e5',
    height: 3,
    borderRadius: 2,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  minHeight: '48px',
  color: theme.palette.mode === 'dark' ? '#e5e7eb' : '#4b5563',
  '&.Mui-selected': {
    color: theme.palette.mode === 'dark' ? '#818cf8' : '#4f46e5',
  },
}));

const FloatingActionButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  zIndex: 1000,
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  color: 'white',
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.2)',
  '&:hover': {
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
      : 'linear-gradient(135deg, #3ba0f7 0%, #00d9e8 100%)',
  },
}));

// Main component
interface Scholarship {
  id: string;
  title: string;
  amount: string;
  description: string;
  color: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  deadline: string;
  category: string;
  icon: React.ReactNode;
  eligibility: string[];
  applicationCount: number;
  sponsor: string;
  duration: string;
  benefits: string[];
}

const ScholarshipPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [applicationFormOpen, setApplicationFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [expandedScholarship, setExpandedScholarship] = useState<string | null>(null);
  const [appliedScholarships, setAppliedScholarships] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(pageRef, { once: true, amount: 0.1 });
  
  // Render the ScholarshipApplicationForm
  const renderApplicationForm = () => (
    <ScholarshipApplicationForm
      open={applicationFormOpen}
      onClose={(applied = false) => handleCloseApplicationForm(applied)}
      scholarshipId={selectedScholarship?.id || ''}
      scholarshipTitle={selectedScholarship?.title || ''}
      price={1} // Default application fee
      currency="INR"
    />
  );
  
  // Removed Apply Now button
  const renderApplyButton = () => null;

  // Fetch user's applied scholarships
  const fetchAppliedScholarships = useCallback(async () => {
    if (!account?.$id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', [account.$id]),
          Query.select(['scholarshipId', 'status', 'payment'])
        ]
      );
      
      // Only consider applications where payment is true
      const appliedIds = new Set(
        response.documents
          .filter(doc => doc.payment === true)
          .map(doc => doc.scholarshipId)
      );
      
      setAppliedScholarships(appliedIds);
    } catch (error) {
      console.error('Error fetching applied scholarships:', error);
      toast.error('Failed to load application status. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [account?.$id]);
  
  // Initial fetch and setup polling
  useEffect(() => {
    fetchAppliedScholarships();
    
    // Set up polling to refresh application status
    const pollInterval = setInterval(fetchAppliedScholarships, 30000); // Every 30 seconds
    
    return () => clearInterval(pollInterval);
  }, [fetchAppliedScholarships]);

  const handleOpenApplicationForm = (scholarship: Scholarship) => {
    if (appliedScholarships.has(scholarship.id)) {
      toast.info('You have already applied for this scholarship');
      return;
    }
    setSelectedScholarship(scholarship);
    setApplicationFormOpen(true);
  };

  const handleCloseApplicationForm = async (applied: boolean = false) => {
    if (applied) {
      // Refresh the list of applied scholarships with a small delay
      // to ensure the backend has processed the payment
      setTimeout(fetchAppliedScholarships, 2000);
    }
    setApplicationFormOpen(false);
    setSelectedScholarship(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedScholarship(expandedScholarship === id ? null : id);
  };

  const scholarships: Scholarship[] = [
    {
      id: '1',
      title: '',
      amount: '₹1,00,000',
      description: 'Awarded to the top performer with outstanding academic and extracurricular achievements. This prestigious scholarship recognizes exceptional talent and provides financial support to help you achieve your educational goals.',
      color: '#FFD700',
      level: '1st Rank',
      deadline: '2025-12-31',
      category: 'Academic',
      icon: <AwardIcon sx={{ color: '#FFD700', fontSize: '2.5rem' }} />,
      eligibility: ['Minimum 90% in previous degree', 'Research publication preferred', 'Extracurricular achievements'],
      applicationCount: 342,
      sponsor: 'Data Tech Alpha Pvt Ltd',
      duration: '1 Semester',
      benefits: ['Full tuition coverage', 'Mentorship program', 'Research grant', 'Networking opportunities']
    },
    {
      id: '2',
      title: '',
      amount: '₹50,000',
      description: 'Recognizing exceptional talent and dedication in academic and research fields. This award supports students who demonstrate strong potential for research and innovation in their chosen field of study.',
      color: '#C0C0C0',
      level: '2nd Rank',
      deadline: '2025-11-30',
      category: 'Research',
      icon: <SchoolIcon sx={{ color: '#C0C0C0', fontSize: '2.5rem' }} />,
      eligibility: ['Minimum 85% in previous degree', 'Research proposal required', 'Letter of recommendation'],
      applicationCount: 218,
      sponsor: 'Data Tech Alpha Pvt Ltd',
      duration: '1 Semester',
      benefits: ['Partial tuition coverage', 'Research materials stipend', 'Conference travel grant']
    },
    {
      id: '3',
      title: '',
      amount: '₹25,000',
      description: 'Supporting promising students with strong academic potential. This scholarship is designed to help students who show exceptional promise but may face financial barriers to continuing their education.',
      color: '#CD7F32',
      level: '3rd Rank',
      deadline: '2025-10-15',
      category: 'Merit',
      icon: <PremiumIcon sx={{ color: '#CD7F32', fontSize: '2.5rem' }} />,
      eligibility: ['Minimum 80% in previous degree', 'Financial need consideration', 'Personal statement'],
      applicationCount: 175,
      sponsor: 'Data Tech Alpha Pvt Ltd',
      duration: '1 Semester',
      benefits: ['Tuition assistance', 'Career counseling', 'Peer mentoring program']
    }
  ];

  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesSearch = !searchTerm || 
      scholarship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.sponsor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = selectedLevel === 'all' || scholarship.level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || scholarship.category === selectedCategory;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const handleLevelChange = (event: SelectChangeEvent) => {
    setSelectedLevel(event.target.value);
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };

  const stats = [
    { value: '75', label: 'Questions', icon: <AwardIcon />, color: '#6366F1' },
    { value: '75 min', label: 'Duration', icon: <AccessTimeIcon />, color: '#10B981' },
    { value: '₹1,00,000', label: 'Top Prize', icon: <EmojiEventsIcon />, color: '#F59E0B' },
    { value: '2 Rounds', label: 'Selection Process', icon: <SchoolIcon />, color: '#EC4899' }
  ];

  // National Aptitude Challenge Section
  const renderExamSection = () => (
    <Box 
      sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 4,
        mb: 4,
        boxShadow: 3,
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0) 70%)',
          borderRadius: '50%',
          transform: 'translate(30%, -30%)',
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
          🎯 Why Participate in Scholar's Edge 2025?
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              icon: '📊',
              title: 'Showcase Your Skills',
              description: 'Demonstrate your abilities in Aptitude, Reasoning & English'
            },
            {
              icon: '🌐',
              title: 'National Competition',
              description: 'Compete with peers from across the country'
            },
            {
              icon: '🏆',
              title: 'Win Attractive Prizes',
              description: 'Earn cash prizes up to ₹1,00,000 and certificates'
            },
            {
              icon: '🚀',
              title: 'Career Boost',
              description: 'Enhance your academic profile with national recognition'
            }
          ].map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box sx={{ 
                bgcolor: 'background.paper', 
                p: 3, 
                borderRadius: 2, 
                height: '100%',
                boxShadow: 2,
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.primary' // Ensure text color adapts to theme
              }}>
                <Typography variant="h3" sx={{ mb: 1, color: 'inherit' }}>{item.icon}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'inherit' }}>{item.title}</Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>{item.description}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          📝 Exam Rounds & Structure
        </Typography>

        <Accordion defaultExpanded={true} sx={{ mb: 3, boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Round 1 – Online Aptitude Test</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <List dense>
                  {[
                    '✅ Mode: Online (from home)',
                    '✅ Format: Objective Q&A (MCQs)',
                    '✅ No. of Questions: 75',
                    '✅ Duration: 75 minutes',
                    '✅ Marking Scheme: 0.25  Negative marking',
                    '✅ Result Announcement: Within 5 days of exam date'
                  ].map((item, index) => (
                    <ListItem key={index} disableGutters sx={{ alignItems: 'flex-start' }}>
                      <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  bgcolor: 'primary.light', 
                  p: 3, 
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Test Pattern:</Typography>
                  <List dense>
                    {[
                      '📊 Quantitative Aptitude (25 Marks)',
                      '🧩 Logical Reasoning (25 Marks)',
                      '📝 English (25 Marks)',
                      '🎯 Total: 75 Questions, 75 Minutes'
                    ].map((item, index) => (
                      <ListItem key={`pattern-${index}`} disableGutters sx={{ alignItems: 'flex-start' }}>
                        <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Grid>
            </Grid>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
              Candidates who qualify in Round 1 will advance to Round 2.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ mb: 3, boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Round 2 – Personal Interview (25 Marks)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {[
                '✅ Evaluation Areas: Communication, Confidence, Problem-Solving Skills',
                '✅ Mode: Online (via video conferencing)',
                '✅ Result Announcement: Within 7 days of interview completion'
              ].map((item, index) => (
                <ListItem key={`round2-${index}`} disableGutters sx={{ alignItems: 'flex-start' }}>
                  <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
            🏆 Prizes & Recognition
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              {
                rank: '1st',
                amount: '₹1,00,000',
                title: 'Certificate of Excellence',
                color: '#FFD700',
                icon: '🥇'
              },
              {
                rank: '2nd',
                amount: '₹50,000',
                title: 'Certificate of Achievement',
                color: '#C0C0C0',
                icon: '🥈'
              },
              {
                rank: '3rd',
                amount: '₹25,000',
                title: 'Certificate of Merit',
                color: '#CD7F32',
                icon: '🥉'
              },
              {
                rank: 'Top 50',
                amount: 'E-Certificate',
                title: 'Certificate of Participation',
                color: '#4CAF50',
                icon: '🏅'
              }
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ 
                  height: '100%', 
                  p: 3, 
                  textAlign: 'center',
                  borderTop: `4px solid ${item.color}`,
                  boxShadow: 2,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}>
                  <Typography variant="h3" sx={{ mb: 1 }}>{item.icon}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: item.color, mb: 1 }}>
                    {item.rank} Prize
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {item.amount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.title}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', mb: 3 }}>
            * All participants will receive an e-certificate of participation. Top 3 winners will receive cash prizes via bank transfer.
          </Typography>
        </Box>

        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 4, 
          borderRadius: 3,
          boxShadow: 2,
          mb: 6
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
            🎓 Eligibility Criteria
          </Typography>
          
          <Box sx={{ 
            bgcolor: 'primary.light', 
            p: 4, 
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              Open for All Students Nationwide
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'center' }}>
              {[
                '✅ Students from Class 10th to Graduation',
                '✅ All streams welcome',
                '✅ No age limit',
                '✅ Passion for learning and competition'
              ].map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Box sx={{ 
                    bgcolor: 'background.paper', 
                    p: 2, 
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.primary' // Ensure text is visible in both light and dark modes
                  }}>
                    <Typography variant="body2" sx={{ textAlign: 'center' }}>{item}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            
            <Button 
              variant="contained" 
              size="large" 
              endIcon={<ArrowForwardIcon />}
              onClick={() => {
                const examScholarship = {
                  id: 'scholars-edge-2025',
                  title: "Scholar's Edge – National Aptitude Challenge 2025",
                  amount: '₹1,00,000',
                  description: 'National Level Aptitude Challenge to showcase your skills and win exciting prizes',
                  color: '#4f46e5',
                  level: 'All Levels',
                  deadline: '2025-12-10',
                  category: 'Aptitude',
                  icon: <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: '2.5rem' }} />,
                  eligibility: ['Class 10th to Graduation', 'Open to all streams', 'No age limit'],
                  applicationCount: 0,
                  sponsor: 'DataTech Alpha Pvt. Ltd.',
                  duration: '2 Rounds',
                  benefits: [
                    'Chance to win up to ₹1,00,000',
                    'Nationally recognized certificate',
                    'Enhance your academic profile',
                    'Compete with peers nationwide'
                  ]
                };
                handleOpenApplicationForm(examScholarship);
              }}
              sx={{ 
                mt: 1,
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #6366F1 30%, #8B5CF6 90%)',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.6)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              Register Now for December 2025 Exam
            </Button>
            
            <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
              Early registration recommended. Limited seats available for each batch.
            </Typography>
          </Box>
          
          <Box sx={{ 
            mt: 4, 
            p: 3, 
            borderRadius: 2, 
            bgcolor: theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)',
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            color: 'text.primary' // Ensure text is visible in both modes
          }}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 'bold', 
              mb: 1, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'text.primary' // Explicit text color
            }}>
              <EmojiEventsIcon fontSize="small" />
              Referral Benefits
            </Typography>
            <Typography variant="body2" sx={{ 
              mb: 2,
              color: 'text.primary' // Explicit text color
            }}>
              Your mobile number is your referral code! Earn 1 point for each successful referral, which will be considered during the evaluation process.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'light'
        ? 'linear-gradient(135deg, #f0f4ff 0%, #f8f9ff 50%, #e0e7ff 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        background: theme.palette.mode === 'light'
          ? 'radial-gradient(circle at 10% 20%, rgba(199, 210, 255, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 70%, rgba(214, 219, 245, 0.4) 0%, transparent 50%)'
          : 'radial-gradient(circle at 10% 20%, rgba(30, 41, 59, 0.4) 0%, transparent 40%), radial-gradient(circle at 90% 70%, rgba(51, 65, 85, 0.4) 0%, transparent 50%)',
        zIndex: 0
      }
    }}>
      {/* Animated background elements */}
      <Box 
        component={motion.div}
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          filter: 'blur(40px)',
          zIndex: 0
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      <Box 
        component={motion.div}
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          filter: 'blur(40px)',
          zIndex: 0
        }}
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
          scale: [1, 0.95, 1.05]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, py: 8, pt: { xs: 12, md: 16 } }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            
            <Typography 
              variant="h1"
              sx={{
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.8rem' },
                fontWeight: 800,
                mb: 2,
                lineHeight: 1.1,
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)'
                  : 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                textAlign: 'center',
                width: '100%'
              }}
            >
              Scholar's Edge – National Aptitude Challenge 2025
            </Typography>
            
            <Typography 
              variant="h6" 
              component="p" 
              sx={{ 
                mb: 4,
                mx: 'auto',
                color: 'primary.main',
                fontWeight: 600,
                fontSize: { xs: '1rem', md: '1.2rem' },
                lineHeight: 1.6,
                maxWidth: '800px',
                textAlign: 'center'
              }}
            >
              Powered by DataTech Alpha Pvt. Ltd. | 🌐 100% Online | 📅 Conducted Twice a Year
              Registration Deadline 14th December 2025
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: 4,
              mb: 6
            }}>
              {stats.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  <GlassCard sx={{ p: 3, minWidth: '180px', textAlign: 'center' }}>
                    <Box sx={{ 
                      display: 'inline-flex', 
                      p: 1.5, 
                      borderRadius: '50%', 
                      background: alpha(item.color, 0.1),
                      color: item.color,
                      mb: 2
                    }}>
                      {React.cloneElement(item.icon, { fontSize: 'large' })}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: 'text.primary' }}>
                      {item.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.label}
                    </Typography>
                  </GlassCard>
                </motion.div>
              ))}
            </Box>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GradientButton
                endIcon={<ArrowForwardIcon />}
                onClick={() => {
                  const element = document.getElementById('scholarships');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                size="large"
              >
                View Scholarships
              </GradientButton>
              <GradientButton
                endIcon={<ArrowForwardIcon />}
                onClick={() => handleOpenApplicationForm(scholarships[0])}
                size="large"
                sx={{ ml: 2 }}
              >
                Apply Now
              </GradientButton>
            </motion.div>
          </motion.div>
        </Box>

        {/* Search and Filter Section */}
        <Box sx={{ mb: 8 }} id="scholarships">
          <GlassCard sx={{ p: 4, mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: 'center', color: 'text.primary' }}>
              Join the National Aptitude Challenge
            </Typography>
            <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
              Test your skills, win prizes, and get nationally recognized for your academic excellence
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search for aptitude challenges or competitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '14px',
                      backgroundColor: theme.palette.background.paper,
                      transition: 'all 0.3s ease',
                    }
                  }}
                />
              </Grid>
              
              {!isMobile && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <Select
                        value={selectedLevel}
                        onChange={handleLevelChange}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Select level' }}
                        sx={{
                          borderRadius: '14px',
                          backgroundColor: theme.palette.background.paper,
                        }}
                      >
                        <MenuItem value="all">All Levels</MenuItem>
                        <MenuItem value="School">School (10th-12th)</MenuItem>
                        <MenuItem value="Undergraduate">Undergraduate</MenuItem>
                        <MenuItem value="Graduate">Graduate</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <Select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Select category' }}
                        sx={{
                          borderRadius: '14px',
                          backgroundColor: theme.palette.background.paper,
                        }}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        <MenuItem value="Aptitude">Aptitude</MenuItem>
                        <MenuItem value="Reasoning">Reasoning</MenuItem>
                        <MenuItem value="English">English</MenuItem>
                        <MenuItem value="General">General Knowledge</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              
              {isMobile && (
                <Grid item xs={12}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<FilterIcon />}
                    onClick={() => setFilterDialogOpen(true)}
                    sx={{ borderRadius: '14px', py: 1.5 }}
                  >
                    Filter Options
                  </Button>
                </Grid>
              )}
            </Grid>
            
            {/* Category Tabs - Removed as per requirements */}
          </GlassCard>

          {/* Results count */}
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
            Scholarship Details
          </Typography>

          {/* Scholarships Grid */}
          {filteredScholarships.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No scholarships match your criteria.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters to see more results.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={4}>
              {filteredScholarships.map((scholarship, index) => (
                <Grid item xs={12} md={6} lg={4} key={scholarship.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5 }}
                  >
                    <GlassCard>
                      <CardContent sx={{ p: 0 }}>
                        {/* Scholarship Header */}
                        <Box sx={{ 
                          p: 3, 
                          pb: 2, 
                          background: `linear-gradient(135deg, ${alpha(scholarship.color, 0.15)} 0%, ${alpha(scholarship.color, 0.05)} 100%)`,
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 48, 
                                height: 48, 
                                borderRadius: '12px',
                                background: alpha(scholarship.color, 0.2),
                                color: scholarship.color,
                                mr: 2
                              }}>
                                {scholarship.icon}
                              </Box>
                              <Box>
                                <Chip 
                                  label={scholarship.level} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: `${scholarship.color}22`, 
                                    color: scholarship.color,
                                    fontWeight: 600,
                                    mb: 0.5
                                  }} 
                                />
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  {scholarship.category}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <IconButton 
                              size="small" 
                              onClick={() => toggleExpand(scholarship.id)}
                              sx={{ 
                                transform: expandedScholarship === scholarship.id ? 'rotate(180deg)' : 'rotate(0)',
                                transition: 'transform 0.3s ease'
                              }}
                            >
                              <ArrowForwardIcon />
                            </IconButton>
                          </Box>
                          
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            {scholarship.title}
                          </Typography>
                          
                          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>
                            {scholarship.amount}
                          </Typography>
                          
                        </Box>
                        
                        {/* Scholarship Body */}
                        <Box sx={{ p: 3 }}>
                          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.6 }}>
                            {scholarship.description}
                          </Typography>
                          
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                              Sponsored by: {scholarship.sponsor}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2 }}>
                              Duration: {scholarship.duration}
                            </Typography>
                          </Box>
                          
                          {/* Expandable Details */}
                          <AnimatePresence>
                            {expandedScholarship === scholarship.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                                    Eligibility Criteria:
                                  </Typography>
                                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {scholarship.eligibility.map((item, idx) => (
                                      <li key={idx}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                          {item}
                                        </Typography>
                                      </li>
                                    ))}
                                  </Box>
                                </Box>
                                
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                                    Benefits:
                                  </Typography>
                                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {scholarship.benefits.map((item, idx) => (
                                      <li key={idx}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                          {item}
                                        </Typography>
                                      </li>
                                    ))}
                                  </Box>
                                </Box>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {renderApplyButton(scholarship)}
                        </Box>
                      </CardContent>
                    </GlassCard>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>

      {/* Filter Dialog for Mobile */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filter Scholarships
            </Typography>
            <IconButton onClick={() => setFilterDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Level
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={selectedLevel}
                onChange={handleLevelChange}
                displayEmpty
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Category
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                displayEmpty
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="Academic">Academic</MenuItem>
                <MenuItem value="Research">Research</MenuItem>
                <MenuItem value="Merit">Merit</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => setFilterDialogOpen(false)}
            sx={{ py: 1.5, borderRadius: '12px' }}
          >
            Apply Filters
          </Button>
        </DialogContent>
      </Dialog>

      {/* Floating Filter Button for Mobile */}
      {isMobile && (
        <FloatingActionButton onClick={() => setFilterDialogOpen(true)}>
          <FilterIcon />
        </FloatingActionButton>
      )}

      {/* Application Form Dialog */}
      <AnimatePresence>
        {applicationFormOpen && selectedScholarship && renderApplicationForm()}
      </AnimatePresence>
      </Box>
      {renderExamSection()}
    </Container>
  );
};

export default ScholarshipPage;