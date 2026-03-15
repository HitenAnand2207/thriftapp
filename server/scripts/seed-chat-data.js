const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Demo script to populate test data for chat system
const DB_PATH = path.join(__dirname, '../data/thriftapp.db');

const seedChatData = () => {
  const db = new sqlite3.Database(DB_PATH);
  
  console.log('🌱 Seeding chat system with test data...');
  
  db.serialize(() => {
    // Create a test admin user if not exists
    db.run(`
      INSERT OR IGNORE INTO users (
        id, email, password, firstName, lastName, name, isAdmin, createdAt, updatedAt
      ) VALUES (
        'ADMIN001',
        'admin@thriftit.com',
        'hashedpassword123',
        'Admin',
        'User',
        'Admin User',
        1,
        datetime('now'),
        datetime('now')
      )
    `, (err) => {
      if (err) {
        console.error('Error creating admin user:', err);
      } else {
        console.log('✅ Created test admin user: admin@thriftit.com');
      }
    });
    
    // Create test customer users
    const testUsers = [
      {
        id: 'USER001',
        email: 'customer1@example.com',
        name: 'Sarah Johnson',
        firstName: 'Sarah',
        lastName: 'Johnson'
      },
      {
        id: 'USER002', 
        email: 'customer2@example.com',
        name: 'Mike Chen',
        firstName: 'Mike',
        lastName: 'Chen'
      },
      {
        id: 'USER003',
        email: 'customer3@example.com', 
        name: 'Emma Davis',
        firstName: 'Emma',
        lastName: 'Davis'
      }
    ];
    
    testUsers.forEach(user => {
      db.run(`
        INSERT OR IGNORE INTO users (
          id, email, password, firstName, lastName, name, isAdmin, createdAt, updatedAt
        ) VALUES (?, ?, 'hashedpassword123', ?, ?, ?, 0, datetime('now'), datetime('now'))
      `, [user.id, user.email, user.firstName, user.lastName, user.name], (err) => {
        if (err) {
          console.error(`Error creating user ${user.email}:`, err);
        } else {
          console.log(`✅ Created test user: ${user.email}`);
        }
      });
    });
    
    // Create sample support tickets
    const sampleTickets = [
      {
        userId: 'USER001',
        status: 'active',
        needsHuman: 1,
        messages: [
          { sender: 'user', message: 'Hi, I need help tracking my order #12345' },
          { sender: 'bot', message: 'I can help you track your order! You can view all your orders and their current status in the "You" section under Order History.' },
          { sender: 'user', message: 'I still can\'t find it. Can I talk to someone?' },
          { sender: 'bot', message: 'I\'ll connect you with a human support agent. Please wait a moment...' }
        ]
      },
      {
        userId: 'USER002',
        status: 'pending',
        needsHuman: 0,
        messages: [
          { sender: 'user', message: 'How do I return an item?' },
          { sender: 'bot', message: 'For returns and exchanges:\n• Items can be returned within 7 days of delivery\n• Items must be in original condition\n• Contact the seller first through their profile\n• If unresolved, our team can help mediate' }
        ]
      },
      {
        userId: 'USER003',
        status: 'resolved',
        needsHuman: 1,
        messages: [
          { sender: 'user', message: 'I\'m having payment issues' },
          { sender: 'bot', message: 'Having payment issues? Here are common solutions:\n• Check if your payment method is valid\n• Ensure sufficient funds/credit limit\n• Try a different payment method\n• Clear browser cache and try again' },
          { sender: 'user', message: 'None of these worked. Need human help.' },
          { sender: 'support', message: 'Hi! I\'m here to help. Can you tell me more about the specific error you\'re seeing during payment?' },
          { sender: 'user', message: 'It says "Payment method declined" but my card works fine elsewhere' },
          { sender: 'support', message: 'This could be a temporary issue with our payment processor. I\'ve refreshed your payment session. Please try again, and let me know if you still see the error.' },
          { sender: 'user', message: 'That worked! Thank you so much!' },
          { sender: 'support', message: 'Great! Glad I could help. Is there anything else you need assistance with today?' }
        ]
      }
    ];
    
    sampleTickets.forEach((ticket, index) => {
      // Insert ticket
      db.run(`
        INSERT INTO support_tickets (
          user_id, status, needs_human_support, created_at, updated_at
        ) VALUES (?, ?, ?, 
          datetime('now', '-' || ? || ' hours'), 
          datetime('now', '-' || ? || ' minutes')
        )
      `, [ticket.userId, ticket.status, ticket.needsHuman, (index + 1) * 2, index * 30], function(err) {
        if (err) {
          console.error('Error creating support ticket:', err);
          return;
        }
        
        const ticketId = this.lastID;
        console.log(`✅ Created support ticket #${ticketId} for ${ticket.userId}`);
        
        // Insert messages for this ticket
        ticket.messages.forEach((msg, msgIndex) => {
          db.run(`
            INSERT INTO chat_messages (
              user_id, support_ticket_id, message, sender_type, admin_name, timestamp
            ) VALUES (?, ?, ?, ?, ?, 
              datetime('now', '-' || ? || ' minutes')
            )
          `, [
            ticket.userId, 
            ticketId, 
            msg.message, 
            msg.sender,
            msg.sender === 'support' ? 'Admin User' : null,
            (index * 60) + (msgIndex * 5)
          ], (err) => {
            if (err) {
              console.error('Error creating message:', err);
            }
          });
        });
      });
    });
    
    // Create some additional random messages for testing
    setTimeout(() => {
      db.run(`
        INSERT INTO support_tickets (
          user_id, status, needs_human_support, created_at, updated_at
        ) VALUES ('USER001', 'active', 0, datetime('now', '-1 hour'), datetime('now', '-30 minutes'))
      `, function(err) {
        if (!err) {
          const ticketId = this.lastID;
          const botMessages = [
            'Hello! How can I assist you with your ThriftIt experience today?',
            'I understand you need help with sizing. For sizing help:\n• Check the size chart on each product\n• Read product descriptions carefully\n• Check seller\'s measurements',
            'Is there anything else I can help you with today?'
          ];
          
          const userMessages = [
            'Hi there!',
            'I need help with sizing for a jacket I want to buy',
            'Thanks, that helps!'
          ];
          
          // Alternate user and bot messages
          for (let i = 0; i < 3; i++) {
            // User message
            db.run(`
              INSERT INTO chat_messages (
                user_id, support_ticket_id, message, sender_type, timestamp
              ) VALUES (?, ?, ?, 'user', datetime('now', '-' || ? || ' minutes'))
            `, ['USER001', ticketId, userMessages[i], 45 - (i * 15)]);
            
            // Bot response
            db.run(`
              INSERT INTO chat_messages (
                user_id, support_ticket_id, message, sender_type, timestamp
              ) VALUES (?, ?, ?, 'bot', datetime('now', '-' || ? || ' minutes'))
            `, ['USER001', ticketId, botMessages[i], 44 - (i * 15)]);
          }
        }
      });
    }, 1000);
  });
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('🎉 Chat system test data seeded successfully!');
      console.log('\n📊 Test Data Summary:');
      console.log('• 1 Admin user (admin@thriftit.com)');
      console.log('• 3 Customer users'); 
      console.log('• 4 Support tickets with conversations');
      console.log('• Mixed bot and human support messages');
      console.log('\n🚀 You can now test the chat system!');
      console.log('📱 Customer chat: Click the blue chat button');
      console.log('👨‍💼 Admin dashboard: Visit /admin/support');
    }
  });
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedChatData();
}

module.exports = { seedChatData };