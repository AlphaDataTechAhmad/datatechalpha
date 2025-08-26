import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Box, Container, Typography, Grid, Card, CardContent, Button, TextField, InputAdornment, MenuItem, Select, FormControl, SelectChangeEvent, IconButton, Chip } from '@mui/material';
import { ScholarshipApplicationForm } from '../components/scholarship/ScholarshipApplicationForm';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Search, FilterAlt, School, EmojiEvents, Info, ArrowForward } from '@mui/icons-material';

const Banner = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  color: 'white',
  padding: '80px 20px',
  textAlign: 'center',
  marginBottom: '40px',
  borderRadius: '8px',
  boxShadow: theme.shadows[5],
  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
}));

const PrizeCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '16px',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
}));

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
}

const ScholarshipPage: React.FC = () => {
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [applicationFormOpen, setApplicationFormOpen] = useState(false);

  const handleOpenApplicationForm = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setApplicationFormOpen(true);
  };

  const handleCloseApplicationForm = () => {
    setApplicationFormOpen(false);
    setSelectedScholarship(null);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(pageRef, { once: true, amount: 0.1 });

  const scholarships: Scholarship[] = [
    {
      id: '1',
      title: '🥇 Gold Excellence Scholarship',
      amount: '₹1,00,000',
      description: 'Awarded to the top performer with outstanding academic and extracurricular achievements. Includes Certificate of Excellence and direct bank transfer of prize money.',
      color: '#FFD700',
      level: 'Advanced',
      deadline: '2025-12-31',
      category: 'Academic',
      icon: <EmojiEvents sx={{ color: '#FFD700', fontSize: '2.5rem' }} />
    },
    {
      id: '2',
      title: '🥈 Silver Achievement Award',
      amount: '₹50,000',
      description: 'Recognizing exceptional talent and dedication in academic and research fields. Includes Certificate of Achievement and direct bank transfer.',
      color: '#C0C0C0',
      level: 'Intermediate',
      deadline: '2025-11-30',
      category: 'Research',
      icon: <School sx={{ color: '#C0C0C0', fontSize: '2.5rem' }} />
    },
    {
      id: '3',
      title: '🥉 Bronze Merit Scholarship',
      amount: '₹25,000',
      description: 'Supporting promising students with strong academic potential. Includes Certificate of Merit and direct bank transfer of prize money.',
      color: '#CD7F32',
      level: 'Beginner',
      deadline: '2025-10-15',
      category: 'Merit',
      icon: <Info sx={{ color: '#CD7F32', fontSize: '2.5rem' }} />
    },
  ];


  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesSearch = !searchTerm || 
      scholarship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.description.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  return (
    <Box ref={pageRef} sx={{ py: 4, minHeight: '100vh' }}>
      <Banner>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <Container maxWidth="lg">
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 800, 
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' },
                lineHeight: 1.2,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              NATIONAL LEVEL SCHOLARSHIP EXAM 2025
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4, 
                fontWeight: 400,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                maxWidth: '800px',
                mx: 'auto',
                opacity: 0.9
              }}
            >
              Unlock Your Potential with Prestigious Awards and Recognition
            </Typography>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="contained" 
                color="secondary" 
                size="large" 
                endIcon={<ArrowForward />}
                onClick={() => handleOpenApplicationForm(scholarships[0])}
                sx={{ 
                  mt: 2, 
                  px: 5, 
                  py: 1.8,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
                  }
                }}
              >
                Apply Now
              </Button>
            </motion.div>
          </Container>
        </motion.div>
      </Banner>

      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Box sx={{ mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              fontWeight: 700, 
              mb: 4, 
              color: 'primary.main',
              textAlign: 'center',
              fontSize: { xs: '1.8rem', md: '2.5rem' }
            }}
          >
            Available Scholarships
          </Typography>
          
          <Box sx={{ width: '100%', maxWidth: '1000px', mb: 4 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search scholarships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: '12px', 
                      bgcolor: 'background.paper',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth>
                  <Select
                    value={selectedLevel}
                    onChange={handleLevelChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Filter by level' }}
                    startAdornment={
                      <InputAdornment position="start" sx={{ ml: 1 }}>
                        <FilterAlt />
                      </InputAdornment>
                    }
                    sx={{ 
                      borderRadius: '12px', 
                      bgcolor: 'background.paper',
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '8px'
                      }
                    }}
                  >
                    <MenuItem value="all">All Levels</MenuItem>
                    <MenuItem value="Beginner">Beginner</MenuItem>
                    <MenuItem value="Intermediate">Intermediate</MenuItem>
                    <MenuItem value="Advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth>
                  <Select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Filter by category' }}
                    startAdornment={
                      <InputAdornment position="start" sx={{ ml: 1 }}>
                        <FilterAlt />
                      </InputAdornment>
                    }
                    sx={{ 
                      borderRadius: '12px', 
                      bgcolor: 'background.paper',
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '8px'
                      }
                    }}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    <MenuItem value="Academic">Academic</MenuItem>
                    <MenuItem value="Research">Research</MenuItem>
                    <MenuItem value="Merit">Merit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Box>
        
        <AnimatePresence>
          <Grid container spacing={4} sx={{ mb: 8 }}>
            {filteredScholarships.map((scholarship, index) => (
              <Grid item xs={12} md={4} key={scholarship.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                >
                  <PrizeCard>
                    <CardContent sx={{ 
                      textAlign: 'center', 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      p: 4
                    }}>
                      <Box 
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          backgroundColor: `${scholarship.color}22`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3,
                          '& svg': {
                            fontSize: '2.5rem',
                          }
                        }}
                      >
                        {scholarship.icon}
                      </Box>
                      
                      <Typography 
                        variant="h5" 
                        component="h3" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 1,
                          color: scholarship.color,
                          minHeight: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {scholarship.title}
                      </Typography>
                      
                      <Typography 
                        variant="h4" 
                        component="div" 
                        sx={{ 
                          fontWeight: 800, 
                          mb: 2,
                          color: 'text.primary',
                          fontSize: '2rem'
                        }}
                      >
                        {scholarship.amount}
                      </Typography>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 3, 
                          color: 'text.secondary',
                          flexGrow: 1
                        }}
                      >
                        {scholarship.description}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 'auto',
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Chip 
                          label={scholarship.level}
                          size="small"
                          sx={{ 
                            bgcolor: `${scholarship.color}22`,
                            color: scholarship.color,
                            fontWeight: 600
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Apply by: {new Date(scholarship.deadline).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="large"
                      endIcon={<ArrowForward />}
                      onClick={() => handleOpenApplicationForm(scholarship)}
                      sx={{
                        borderRadius: '0 0 8px 8px',
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Apply Now
                    </Button>
                  </PrizeCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </AnimatePresence>
        
        <Box sx={{ mb: 8, backgroundColor: '#f9f9f9', p: 4, borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4, color: 'primary.main' }}>
            Exam Details
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>Eligibility Criteria:</Typography>
              <ul>
                <li>Students from Class 9th to Graduation</li>
                <li>No minimum percentage required</li>
                <li>Open to all streams and boards</li>
                <li>Indian Nationals only</li>
              </ul>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3, fontWeight: 'bold', color: 'text.primary' }}>Important Dates:</Typography>
              <ul>
                <li>Registration Deadline: December 31, 2024</li>
                <li>Exam Date: January 25, 2025</li>
                <li>Result Declaration: February 15, 2025</li>
              </ul>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>Exam Pattern:</Typography>
              <ul>
                <li>Duration: 2 Hours</li>
                <li>Total Marks: 200</li>
                <li>Type: Multiple Choice Questions (MCQs)</li>
                <li>Negative Marking: 0.25 marks for each wrong answer</li>
              </ul>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3, fontWeight: 'bold', color: 'text.primary' }}>Syllabus:</Typography>
              <ul>
                <li>Mathematics</li>
                <li>Science</li>
                <li>General Knowledge</li>
                <li>Logical Reasoning</li>
              </ul>
            </Grid>
          </Grid>
        </Box>



        <Box sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white', 
          p: 4, 
          borderRadius: 2,
          textAlign: 'center',
          mb: 4
        }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            Ready to Showcase Your Talent?
          </Typography>
          <Typography variant="body1" paragraph>
            Don't miss this opportunity to win exciting prizes and get national recognition.
            Register now and take the first step towards a brighter future!
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            onClick={() => handleOpenApplicationForm(scholarships[0])}
            sx={{ 
              mt: 2, 
              px: 4, 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: '50px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
              '&:hover': {
                backgroundColor: 'secondary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 8px rgba(0,0,0,0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Apply Now
          </Button>
        </Box>
      </Container>

      {/* Scholarship Application Form Dialog */}
      {selectedScholarship && (
        <ScholarshipApplicationForm
          open={applicationFormOpen}
          onClose={handleCloseApplicationForm}
          scholarshipId={selectedScholarship.id}
          scholarshipTitle={selectedScholarship.title}
          price={parseInt(selectedScholarship.amount.replace(/[^0-9]/g, ''))}
          currency="INR"
        />
      )}
    </Box>
  );
};

export default ScholarshipPage;
